import { Keypair, PublicKey } from "@solana/web3.js"
import { loadWalletFromFile } from "./config"
import * as bs58 from "bs58"

export class WalletUtils {
	/**
	 * Load a keypair from a file path (Solana CLI format)
	 */
	static loadKeypairFromFile(walletPath?: string): Keypair {
		try {
			const secretKey = loadWalletFromFile(walletPath)
			return Keypair.fromSecretKey(new Uint8Array(secretKey))
		} catch (error) {
			throw new Error(`Failed to load keypair from file: ${error}`)
		}
	}

	/**
	 * Load a keypair from a base58 encoded private key
	 */
	static loadKeypairFromPrivateKey(privateKey: string): Keypair {
		try {
			const secretKey = bs58.decode(privateKey)
			return Keypair.fromSecretKey(secretKey)
		} catch (error) {
			throw new Error(`Failed to load keypair from private key: ${error}`)
		}
	}

	/**
	 * Create a new random keypair
	 */
	static generateKeypair(): Keypair {
		return Keypair.generate()
	}

	/**
	 * Get the base58 encoded private key from a keypair
	 */
	static getPrivateKeyString(keypair: Keypair): string {
		return bs58.encode(keypair.secretKey)
	}

	/**
	 * Validate if a string is a valid Solana public key
	 */
	static isValidPublicKey(address: string): boolean {
		try {
			new PublicKey(address)
			return true
		} catch {
			return false
		}
	}

	/**
	 * Convert string to PublicKey with validation
	 */
	static toPublicKey(address: string): PublicKey {
		if (!this.isValidPublicKey(address)) {
			throw new Error(`Invalid Solana address: ${address}`)
		}
		return new PublicKey(address)
	}
}
