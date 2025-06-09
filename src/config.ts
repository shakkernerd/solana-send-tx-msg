import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import { SolanaConfig } from "./types"

// Load environment variables
dotenv.config()

/**
 * Get the configuration for the Solana message sender
 *
 * Defaults to devnet if no environment variables are set
 * @returns {SolanaConfig} The configuration object
 */
export function getConfig(): SolanaConfig {
	return {
		rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
		wsUrl: process.env.SOLANA_WS_URL || "wss://api.devnet.solana.com",
		network: (process.env.SOLANA_NETWORK as any) || "devnet",
		commitment: (process.env.COMMITMENT as any) || "confirmed",
		skipPreflight: process.env.SKIP_PREFLIGHT === "true",
		walletPath: process.env.WALLET_PATH,
		privateKey: process.env.PRIVATE_KEY,
	}
}

/**
 * Load a wallet from a file
 * @param {string} walletPath - The path to the wallet file
 * @returns {number[]} The wallet data
 */
export function loadWalletFromFile(walletPath?: string): number[] {
	const path = walletPath || join(homedir(), ".config", "solana", "id.json")

	try {
		const expandedPath = path.replace("~", homedir())
		const walletData = readFileSync(expandedPath, "utf8")
		return JSON.parse(walletData)
	} catch (error) {
		throw new Error(`Failed to load wallet from ${path}: ${error}`)
	}
}

/**
 * Get the explorer URL for a transaction
 * @param {string} signature - The transaction signature
 * @param {string} network - The network name
 * @returns {string} The explorer URL
 */
export function getExplorerUrl(signature: string, network: string): string {
	const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`
	return `https://explorer.solana.com/tx/${signature}${cluster}`
}
