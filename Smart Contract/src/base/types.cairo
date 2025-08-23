use starknet::ContractAddress;
// Structs for storage
#[derive(Drop, Serde, PartialEq, starknet::Store)]
pub struct Patient {
    pub uuid: felt252, // Short UUID for simplicity
    pub name: ByteArray,
    pub patient_address: ContractAddress,
    pub medical_history_count: u256, // Tracks number of records
    pub exists: bool,
}

#[derive(Drop, Serde, PartialEq, starknet::Store)]
pub struct Hospital {
    pub uuid: felt252,
    pub name: ByteArray,
    pub hospital_address: ContractAddress,
    pub exists: bool,
}
