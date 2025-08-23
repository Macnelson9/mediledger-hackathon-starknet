// Interface definition
#[starknet::interface]
pub trait IMediLedger<TContractState> {
    fn register_patient(ref self: TContractState, name: ByteArray, uuid: felt252);
    fn register_hospital(ref self: TContractState, name: ByteArray, uuid: felt252);
    fn add_record(ref self: TContractState, patient_id: felt252, ipfs_hash: ByteArray);
    fn get_records(self: @TContractState, patient_id: felt252) -> Array<ByteArray>;
    fn request_access(ref self: TContractState, patient_id: felt252);
    fn grant_access(ref self: TContractState, hospital_id: felt252, patient_id: felt252);
    fn revoke_access(ref self: TContractState, hospital_id: felt252, patient_id: felt252);
    fn verify_patient(self: @TContractState, patient_id: felt252) -> bool;
    fn verify_hospital(self: @TContractState, hospital_id: felt252) -> bool;
    fn get_access_request_limit(self: @TContractState) -> u256;
    fn get_subscription_fee(self: @TContractState) -> u256;
}
