import { Abi } from "starknet";

export const contractAddress =
  "0x007048183ef958ea028cc7739ef23d97922802459d3e09ee3801bb3d2467f544";


export const MEDILEDGER_ABI: Abi = [
  {
    type: "impl",
    name: "MediLedgerImpl",
    interface_name: "medi_ledger::interface::IMediLedger::IMediLedger",
  },
  {
    type: "struct",
    name: "core::byte_array::ByteArray",
    members: [
      {
        name: "data",
        type: "core::array::Array::<core::bytes_31::bytes31>",
      },
      {
        name: "pending_word",
        type: "core::felt252",
      },
      {
        name: "pending_word_len",
        type: "core::integer::u32",
      },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      {
        name: "False",
        type: "()",
      },
      {
        name: "True",
        type: "()",
      },
    ],
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      {
        name: "low",
        type: "core::integer::u128",
      },
      {
        name: "high",
        type: "core::integer::u128",
      },
    ],
  },
  {
    type: "interface",
    name: "medi_ledger::interface::IMediLedger::IMediLedger",
    items: [
      {
        type: "function",
        name: "register_patient",
        inputs: [
          {
            name: "name",
            type: "core::byte_array::ByteArray",
          },
          {
            name: "uuid",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "register_hospital",
        inputs: [
          {
            name: "name",
            type: "core::byte_array::ByteArray",
          },
          {
            name: "uuid",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "add_record",
        inputs: [
          {
            name: "patient_id",
            type: "core::felt252",
          },
          {
            name: "ipfs_hash",
            type: "core::byte_array::ByteArray",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_records",
        inputs: [
          {
            name: "patient_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::array::Array::<core::byte_array::ByteArray>",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "request_access",
        inputs: [
          {
            name: "patient_id",
            type: "core::felt252",
          },
          {
            name: "token_address",
            type: "core::starknet::contract_address::ContractAddress",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "grant_access",
        inputs: [
          {
            name: "hospital_id",
            type: "core::felt252",
          },
          {
            name: "patient_id",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "revoke_access",
        inputs: [
          {
            name: "hospital_id",
            type: "core::felt252",
          },
          {
            name: "patient_id",
            type: "core::felt252",
          },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "verify_patient",
        inputs: [
          {
            name: "patient_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "verify_hospital",
        inputs: [
          {
            name: "hospital_id",
            type: "core::felt252",
          },
        ],
        outputs: [
          {
            type: "core::bool",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_access_request_limit",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_subscription_fee",
        inputs: [],
        outputs: [
          {
            type: "core::integer::u256",
          },
        ],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "constructor",
    name: "constructor",
    inputs: [],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::PatientRegistered",
    kind: "struct",
    members: [
      {
        name: "patient_id",
        type: "core::felt252",
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::HospitalRegistered",
    kind: "struct",
    members: [
      {
        name: "hospital_id",
        type: "core::felt252",
        kind: "key",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::PatientRecordAdded",
    kind: "struct",
    members: [
      {
        name: "patient_id",
        type: "core::felt252",
        kind: "key",
      },
      {
        name: "hospital_id",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "ipfs_hash",
        type: "core::byte_array::ByteArray",
        kind: "data",
      },
      {
        name: "timestamp",
        type: "core::integer::u64",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::AccessRequested",
    kind: "struct",
    members: [
      {
        name: "hospital_id",
        type: "core::felt252",
        kind: "key",
      },
      {
        name: "patient_id",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "timestamp",
        type: "core::integer::u64",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::AccessGranted",
    kind: "struct",
    members: [
      {
        name: "hospital_id",
        type: "core::felt252",
        kind: "key",
      },
      {
        name: "patient_id",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "timestamp",
        type: "core::integer::u64",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::AccessRevoked",
    kind: "struct",
    members: [
      {
        name: "hospital_id",
        type: "core::felt252",
        kind: "key",
      },
      {
        name: "patient_id",
        type: "core::felt252",
        kind: "data",
      },
      {
        name: "timestamp",
        type: "core::integer::u64",
        kind: "data",
      },
    ],
  },
  {
    type: "event",
    name: "medi_ledger::mediLedger::MediLedger::Event",
    kind: "enum",
    variants: [
      {
        name: "PatientRegistered",
        type: "medi_ledger::mediLedger::MediLedger::PatientRegistered",
        kind: "nested",
      },
      {
        name: "HospitalRegistered",
        type: "medi_ledger::mediLedger::MediLedger::HospitalRegistered",
        kind: "nested",
      },
      {
        name: "PatientRecordAdded",
        type: "medi_ledger::mediLedger::MediLedger::PatientRecordAdded",
        kind: "nested",
      },
      {
        name: "AccessRequested",
        type: "medi_ledger::mediLedger::MediLedger::AccessRequested",
        kind: "nested",
      },
      {
        name: "AccessGranted",
        type: "medi_ledger::mediLedger::MediLedger::AccessGranted",
        kind: "nested",
      },
      {
        name: "AccessRevoked",
        type: "medi_ledger::mediLedger::MediLedger::AccessRevoked",
        kind: "nested",
      },
    ],
  },
];
