#[starknet::contract]
pub mod MediLedger {
    use medi_ledger::base::types::{
        Hospital, Patient,
    }; // Assuming these structs are defined in base/types.cairo
    use medi_ledger::interface::IMediLedger::IMediLedger;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, contract_address_const,get_contract_address, get_block_timestamp, get_caller_address,
    };
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        patients: Map<felt252, Patient>,
        medical_history: Map<(felt252, u256), ByteArray>, // (patient_id, index) -> IPFS CID
        hospitals: Map<felt252, Hospital>,
        patient_id_of: Map<ContractAddress, felt252>,
        hospital_id_of: Map<ContractAddress, felt252>,
        hospital_patient_access: Map<
            (felt252, felt252), bool,
        >, // (hospital_id, patient_id) -> access
        hospital_access_requests: Map<felt252, u256>, // hospital_id -> request count
        hospital_balances: Map<ContractAddress, u256>, // hospital_address -> balance (placeholder)
        access_request_limit: u256,
        subscription_fee: u256,
        token_address: ContractAddress, // ERC20 token for payments
        reentrancy_guard: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PatientRegistered: PatientRegistered,
        HospitalRegistered: HospitalRegistered,
        PatientRecordAdded: PatientRecordAdded,
        AccessRequested: AccessRequested,
        AccessGranted: AccessGranted,
        AccessRevoked: AccessRevoked,
    }

    #[derive(Drop, starknet::Event)]
    struct PatientRegistered {
        #[key]
        patient_id: felt252,
    }


    #[derive(Drop, starknet::Event)]
    struct HospitalRegistered {
        #[key]
        hospital_id: felt252,
    }
    #[derive(Drop, starknet::Event)]
    struct PatientRecordAdded {
        #[key]
        patient_id: felt252,
        hospital_id: felt252,
        ipfs_hash: ByteArray,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AccessRequested {
        #[key]
        hospital_id: felt252,
        patient_id: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AccessGranted {
        #[key]
        hospital_id: felt252,
        patient_id: felt252,
        timestamp: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct AccessRevoked {
        #[key]
        hospital_id: felt252,
        patient_id: felt252,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        access_request_limit: u256,
        subscription_fee: u256,
        token_address: ContractAddress,
    ) {
        let zero_address: ContractAddress = contract_address_const::<'0x0'>();
        assert(token_address != zero_address, 'Invalid token address');
        self.access_request_limit.write(access_request_limit);
        self.subscription_fee.write(subscription_fee);
        self.token_address.write(token_address);
    }

    #[abi(embed_v0)]
    impl MediLedgerImpl of IMediLedger<ContractState> {
        fn register_patient(ref self: ContractState, name: ByteArray, uuid: felt252) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            assert(uuid != 0, 'UUID cannot be empty');
            assert(name.len() > 0, 'Name cannot be empty');
            let patient = self.patients.read(uuid);
            assert(!patient.exists, 'Patient already registered');
            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let existing_id = self.patient_id_of.read(caller);
            assert(existing_id == 0, 'Address already registered');

            self
                .patients
                .write(
                    uuid,
                    Patient {
                        uuid, name, patient_address: caller, medical_history_count: 0, exists: true,
                    },
                );
            self.patient_id_of.write(caller, uuid);
            self.emit(PatientRegistered { patient_id: uuid });

            self.reentrancy_guard.write(false);
        }

        fn register_hospital(ref self: ContractState, name: ByteArray, uuid: felt252) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            assert(uuid != 0, 'UUID empty');
            assert(name.len() > 0, 'Name empty');
            let hospital = self.hospitals.read(uuid);
            assert(!hospital.exists, 'Hospital UUID exists');
            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let existing_id = self.hospital_id_of.read(caller);
            assert(existing_id == 0, 'Address already hospital');

            self
                .hospitals
                .write(uuid, Hospital { uuid, name, hospital_address: caller, exists: true });
            self.hospital_id_of.write(caller, uuid);
            self.emit(HospitalRegistered { hospital_id: uuid });

            self.reentrancy_guard.write(false);
        }


        fn add_record(ref self: ContractState, patient_id: felt252, ipfs_hash: ByteArray) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            assert(ipfs_hash.len() > 0, 'Invalid IPFS hash');
            let patient = self.patients.read(patient_id);
            assert(patient.exists, 'Patient not found');

            let caller = get_caller_address();
            let hospital_id = self.hospital_id_of.read(caller);
            let hospital = self.hospitals.read(hospital_id);
            assert(
                hospital.exists && hospital.hospital_address == caller, 'Hospital does not exist',
            );
            assert(
                self.hospital_patient_access.read((hospital_id, patient_id)), 'Access not granted',
            );

            let index = patient.medical_history_count;
            self.medical_history.write((patient_id, index), ipfs_hash.clone());
            self
                .patients
                .write(
                    patient_id,
                    Patient {
                        uuid: patient_id,
                        name: patient.name,
                        patient_address: patient.patient_address,
                        medical_history_count: index + 1,
                        exists: true,
                    },
                );
            self
                .emit(
                    PatientRecordAdded {
                        patient_id, hospital_id, ipfs_hash, timestamp: get_block_timestamp(),
                    },
                );

            self.reentrancy_guard.write(false);
        }

        fn get_records(self: @ContractState, patient_id: felt252) -> Array<ByteArray> {
            let patient = self.patients.read(patient_id);
            assert(patient.exists, 'Patient not found');

            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let mut authorized = false;
            if caller == patient.patient_address {
                authorized = true;
            } else {
                let hospital_id = self.hospital_id_of.read(caller);
                assert(hospital_id != 0, 'Hospital not registered');
                authorized = self.hospital_patient_access.read((hospital_id, patient_id));
            }
            assert(authorized, 'Not authorized');

            let mut records = ArrayTrait::new();
            let count = patient.medical_history_count;
            let mut i: u256 = 0;
            while i != count {
                records.append(self.medical_history.read((patient_id, i)));
                i += 1;
            }
            records
        }

        fn request_access(ref self: ContractState, patient_id: felt252) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let hospital_id = self.hospital_id_of.read(caller);
            assert(hospital_id != 0, 'Hospital not registered');
            let patient = self.patients.read(patient_id);
            assert(patient.exists, 'Patient not found');

            let current_requests = self.hospital_access_requests.read(hospital_id);
            if current_requests >= self.access_request_limit.read() {
                let token = IERC20Dispatcher { contract_address: self.token_address.read() };
                let amount = self.subscription_fee.read();
                let contract_address = get_contract_address();
                let allowance = token.allowance(caller, contract_address);
                assert(allowance >= amount, 'Insufficient allowance');
                let success = token.transfer_from(caller, contract_address, amount);
                assert(success, 'Token transfer failed');
                self.hospital_balances.write(caller, self.hospital_balances.read(caller) + amount);
                self.hospital_access_requests.write(hospital_id, 0);
            }

            self.hospital_access_requests.write(hospital_id, current_requests + 1);
            self
                .emit(
                    AccessRequested { hospital_id, patient_id, timestamp: get_block_timestamp() },
                );

            self.reentrancy_guard.write(false);
        }

        fn grant_access(ref self: ContractState, hospital_id: felt252, patient_id: felt252) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let patient = self.patients.read(patient_id);
            assert(
                patient.exists && patient.patient_address == caller,
                'Only patient can grant access',
            );
            let hospital = self.hospitals.read(hospital_id);
            assert(hospital.exists, 'Hospital not found');

            self.hospital_patient_access.write((hospital_id, patient_id), true);
            self.emit(AccessGranted { hospital_id, patient_id, timestamp: get_block_timestamp() });

            self.reentrancy_guard.write(false);
        }

        fn revoke_access(ref self: ContractState, hospital_id: felt252, patient_id: felt252) {
            assert(!self.reentrancy_guard.read(), 'Reentrancy detected');
            self.reentrancy_guard.write(true);

            let caller = get_caller_address();
            let zero_address: ContractAddress = contract_address_const::<'0x0'>();
            assert(caller != zero_address, 'Invalid caller address');
            let patient = self.patients.read(patient_id);
            assert(
                patient.exists && patient.patient_address == caller,
                'Only patient can revoke access',
            );
            let hospital = self.hospitals.read(hospital_id);
            assert(hospital.exists, 'Hospital not found');

            self.hospital_patient_access.write((hospital_id, patient_id), false);
            self.emit(AccessRevoked { hospital_id, patient_id, timestamp: get_block_timestamp() });

            self.reentrancy_guard.write(false);
        }

        fn verify_patient(self: @ContractState, patient_id: felt252) -> bool {
            self.patients.read(patient_id).exists
        }

        fn verify_hospital(self: @ContractState, hospital_id: felt252) -> bool {
            self.hospitals.read(hospital_id).exists
        }

        fn get_access_request_limit(self: @ContractState) -> u256 {
            self.access_request_limit.read()
        }

        fn get_subscription_fee(self: @ContractState) -> u256 {
            self.subscription_fee.read()
        }
    }
}
