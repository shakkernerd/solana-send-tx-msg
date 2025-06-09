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

// New interfaces for bulk messaging
export interface BulkMessageConfig {
	message: string
	recipientAddresses: PublicKey[]
	senderKeypair: Keypair
	connection?: Connection
	commitment?: "processed" | "confirmed" | "finalized"
	skipPreflight?: boolean
	delayBetweenTx?: number // milliseconds delay between transactions
	continueOnError?: boolean // continue sending even if some fail
}

export interface BulkTransactionResult {
	recipientAddress: string
	signature: string
	success: boolean
	error?: string
	explorerUrl?: string
}

export interface BulkMessageResult {
	totalSent: number
	totalFailed: number
	results: BulkTransactionResult[]
	overallSuccess: boolean
}

// New interfaces for file-based recipient handling
export interface FileRecipientConfig extends Omit<BulkMessageConfig, "recipientAddresses"> {
	recipientsFile: string
}

export interface FileValidationResult {
	isValid: boolean
	addresses: string[]
	validAddresses: PublicKey[]
	invalidAddresses: string[]
	error?: string
}
