use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};
use medi_ledger::interface::IMediLedger::{IMediLedgerDispatcher, IMediLedgerDispatcherTrait}; 
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use snforge_std::{
    start_cheat_block_timestamp,
    start_cheat_caller_address, stop_cheat_caller_address,
};   use starknet::{
        ContractAddress, contract_address_const,get_contract_address, get_block_timestamp, get_caller_address,
    };

pub fn deploy_mock_erc20(name: ByteArray) -> IERC20Dispatcher {
    let admin: ContractAddress = contract_address_const::<'admin'>();
    let contract = declare("MyToken").unwrap().contract_class();
    let mut calldata = array![];
    let token_name: ByteArray = name.clone();
    let token_symbol: ByteArray = name.clone();

    token_name.serialize(ref calldata);
    token_symbol.serialize(ref calldata);
    admin.serialize(ref calldata);

    let (contract_address, _) = contract.deploy(@calldata).unwrap();

    IERC20Dispatcher { contract_address }
}

fn deploy_contract() -> (IMediLedgerDispatcher, ContractAddress) {
    let contract = declare("MediLedger").unwrap().contract_class();
    let erc20 = deploy_mock_erc20("STRK");
    let access_request_limit: u256 = 1000;
    let subscription_fee: u256 = 100;
    let token_address = erc20.contract_address;
    let mut calldata = ArrayTrait::new();
    access_request_limit.serialize(ref calldata);
    subscription_fee.serialize(ref calldata);
    token_address.serialize(ref calldata);
    let (contract_address, _) = contract.deploy(@calldata).unwrap();
    (IMediLedgerDispatcher { contract_address }, token_address)
}

#[test]
fn test_contract_register_patient() {
    let (dispatcher, _) = deploy_contract();
    let name: ByteArray = "Test Hospital";
    let uuid: felt252 = 123456789;
    dispatcher.register_patient(name, uuid);

    let success = dispatcher.verify_patient(uuid);
    assert!(success, "Patient registration failed");
}

#[test]
fn test_contract_register_hospital() {
    let (dispatcher, _) = deploy_contract();
    let name: ByteArray = "Test Hospital";
    let uuid: felt252 = 123456789;
    dispatcher.register_hospital(name, uuid);

    let success = dispatcher.verify_hospital(uuid);
    assert!(success, "Hospital registration failed");
}
    

