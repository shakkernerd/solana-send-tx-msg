import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair, sendAndConfirmTransaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { MessageConfig, TransactionResult, SolanaConfig } from "./types"
import { getConfig, getExplorerUrl } from "./config"

export class SolanaMessageSender {
	private connection: Connection
	private config: SolanaConfig

	constructor(customConfig?: Partial<SolanaConfig>) {
		this.config = { ...getConfig(), ...customConfig }
		this.connection = new Connection(this.config.rpcUrl, this.config.commitment)
	}

	/**
	 * Sends a message to a recipient address using a Solana transaction
	 * The message is encoded in the transaction memo instruction
	 */
	async sendMessage(config: MessageConfig): Promise<TransactionResult> {
		try {
			console.log(`Sending message to ${config.recipientAddress.toBase58()}`)
			console.log(`Message: "${config.message}"`)

			const connection = config.connection || this.connection

			// Create the transaction
			const transaction = new Transaction()

			// Add memo instruction with the message
			const memoInstruction = new TransactionInstruction({
				keys: [],
				programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"), // Memo program ID
				data: Buffer.from(config.message, "utf8"),
			})

			// Add a small SOL transfer to the recipient (optional, can be 0)
			const transferInstruction = SystemProgram.transfer({
				fromPubkey: config.senderKeypair.publicKey,
				toPubkey: config.recipientAddress,
				lamports: 1000, // 0.000001 SOL as a small notification
			})

			transaction.add(memoInstruction)
			transaction.add(transferInstruction)

			// Set recent blockhash and fee payer
			const { blockhash } = await connection.getLatestBlockhash()
			transaction.recentBlockhash = blockhash
			transaction.feePayer = config.senderKeypair.publicKey

			// Send and confirm transaction
			const signature = await sendAndConfirmTransaction(connection, transaction, [config.senderKeypair], {
				commitment: config.commitment || this.config.commitment,
				skipPreflight: config.skipPreflight || this.config.skipPreflight,
			})

			const explorerUrl = getExplorerUrl(signature, this.config.network)

			console.log(`Message sent successfully!`)
			console.log(`Transaction signature: ${signature}`)
			console.log(`Explorer URL: ${explorerUrl}`)

			return {
				signature,
				success: true,
				explorerUrl,
			}
		} catch (error) {
			console.error("Failed to send message:", error)

			return {
				signature: "",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	}

	/**
	 * Sends a message without any SOL transfer (memo only)
	 *
	 * Note: Memo only transactions do NOT get sent to a recipient address
	 * and are not visible to the recipient.
	 */
	async sendMemoOnly(config: Omit<MessageConfig, "recipientAddress">): Promise<TransactionResult> {
		try {
			console.log(`Sending memo: "${config.message}"`)

			const connection = config.connection || this.connection

			// Create the transaction with memo only
			const transaction = new Transaction()

			const memoInstruction = new TransactionInstruction({
				keys: [],
				programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
				data: Buffer.from(config.message, "utf8"),
			})

			transaction.add(memoInstruction)

			const { blockhash } = await connection.getLatestBlockhash()
			transaction.recentBlockhash = blockhash
			transaction.feePayer = config.senderKeypair.publicKey

			const signature = await sendAndConfirmTransaction(connection, transaction, [config.senderKeypair], {
				commitment: config.commitment || this.config.commitment,
				skipPreflight: config.skipPreflight || this.config.skipPreflight,
			})

			const explorerUrl = getExplorerUrl(signature, this.config.network)

			console.log(`Memo sent successfully!`)
			console.log(`Transaction signature: ${signature}`)
			console.log(`Explorer URL: ${explorerUrl}`)

			return {
				signature,
				success: true,
				explorerUrl,
			}
		} catch (error) {
			console.error("Failed to send memo:", error)

			return {
				signature: "",
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	}

	/**
	 * Get the balance of a wallet
	 */
	async getBalance(publicKey: PublicKey): Promise<number> {
		const balance = await this.connection.getBalance(publicKey)
		return balance / LAMPORTS_PER_SOL
	}

	/**
	 * Check if a wallet has sufficient balance for a transaction
	 */
	async checkBalance(publicKey: PublicKey, requiredSol: number = 0.001): Promise<boolean> {
		const balance = await this.getBalance(publicKey)
		return balance >= requiredSol
	}
}
