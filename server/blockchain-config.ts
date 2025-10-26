// Smart Contract Addresses and Configuration
export const CONTRACT_ADDRESSES = {
  users: "0x7ddd2eb4ece89825096367fd6f72623996ad1a55",
  medical: "0x33b7b70a1a20233b441527a7cd5b43c791d78860",
  treatments: "0x865f4b7835cffad383d33211033ea3b747010cd8",
  insurance: "0xeaa1afa47136f28828464a69e21046da8706c635",
  payments: "0x479a9cd7bee5a12333ae3f44ad7b960aaf479278ffcb733cf3f4f80d00f465ae",
} as const;

// BlockDAG RPC Configuration
export const BLOCKCHAIN_CONFIG = {
  rpcUrl: process.env.BLOCKDAG_RPC_URL || "https://rpc.awakening.bdagscan.com",
  chainId: 1043, // BlockDAG Awakening Chain ID
  networkName: "BlockDAG Awakening",
  explorerUrl: "https://awakening.bdagscan.com",
};

// Gas configuration
export const GAS_CONFIG = {
  gasLimit: 500000,
  maxFeePerGas: undefined, // Let provider estimate
  maxPriorityFeePerGas: undefined, // Let provider estimate
};
