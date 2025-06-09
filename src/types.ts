import { PublicKey, Keypair, Connection } from "@solana/web3.js"

export interface MessageConfig {
	message: string
	recipientAddress: PublicKey
	senderKeypair: Keypair
	connection?: Connection
	commitment?: "processed" | "confirmed" | "finalized"
	skipPreflight?: boolean
}

export interface TransactionResult {
	signature: string
	success: boolean
	error?: string
	explorerUrl?: string
}

export interface SolanaConfig {
	rpcUrl: string
	wsUrl: string
	network: "devnet" | "testnet" | "mainnet-beta"
	commitment: "processed" | "confirmed" | "finalized"
	skipPreflight: boolean
	walletPath?: string
	privateKey?: string
}

export interface MessageInstruction {
	programId: PublicKey
	keys: Array<{
		pubkey: PublicKey
		isSigner: boolean
		isWritable: boolean
	}>
	data: Uint8Array
}
