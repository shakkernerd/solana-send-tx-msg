import { Connection, PublicKey, Transaction, TransactionInstruction, Keypair, sendAndConfirmTransaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { MessageConfig, TransactionResult, SolanaConfig, BulkMessageConfig, BulkMessageResult, BulkTransactionResult, FileRecipientConfig } from "./types"
import { getConfig, getExplorerUrl } from "./config"
import { FileUtils } from "./fileUtils"

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

	/**
	 * Sends messages to multiple recipients with SOL transfers
	 */
	async sendBulkMessages(config: BulkMessageConfig): Promise<BulkMessageResult> {
		console.log(`Sending message to ${config.recipientAddresses.length} recipients`)
		console.log(`Message: "${config.message}"`)

		const results: BulkTransactionResult[] = []
		let totalSent = 0
		let totalFailed = 0

		for (let i = 0; i < config.recipientAddresses.length; i++) {
			const recipient = config.recipientAddresses[i]
			const recipientAddress = recipient.toBase58()

			try {
				console.log(`[${i + 1}/${config.recipientAddresses.length}] Sending to ${recipientAddress}`)

				const result = await this.sendMessage({
					message: config.message,
					recipientAddress: recipient,
					senderKeypair: config.senderKeypair,
					connection: config.connection,
					commitment: config.commitment,
					skipPreflight: config.skipPreflight,
				})

				if (result.success) {
					totalSent++
					results.push({
						recipientAddress,
						signature: result.signature,
						success: true,
						explorerUrl: result.explorerUrl,
					})
					console.log(`✅ Sent to ${recipientAddress}: ${result.signature}`)
				} else {
					totalFailed++
					results.push({
						recipientAddress,
						signature: "",
						success: false,
						error: result.error,
					})
					console.log(`❌ Failed to send to ${recipientAddress}: ${result.error}`)

					if (!config.continueOnError) {
						console.log("Stopping bulk send due to error (continueOnError=false)")
						break
					}
				}

				// Add delay between transactions if specified
				if (config.delayBetweenTx && i < config.recipientAddresses.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, config.delayBetweenTx))
				}
			} catch (error) {
				totalFailed++
				const errorMessage = error instanceof Error ? error.message : "Unknown error"
				results.push({
					recipientAddress,
					signature: "",
					success: false,
					error: errorMessage,
				})
				console.log(`❌ Failed to send to ${recipientAddress}: ${errorMessage}`)

				if (!config.continueOnError) {
					console.log("Stopping bulk send due to error (continueOnError=false)")
					break
				}
			}
		}

		const overallSuccess = totalFailed === 0

		console.log(`\n📊 Bulk message summary:`)
		console.log(`Total sent: ${totalSent}`)
		console.log(`Total failed: ${totalFailed}`)
		console.log(`Overall success: ${overallSuccess}`)

		return {
			totalSent,
			totalFailed,
			results,
			overallSuccess,
		}
	}

	/**
	 * Sends memo-only messages to multiple recipients (no SOL transfer)
	 * Note: These are just memos in separate transactions, not actually sent "to" the recipients
	 */
	async sendBulkMemoOnly(config: Omit<BulkMessageConfig, "recipientAddresses"> & { messages?: string[] }): Promise<BulkMessageResult> {
		const messages = config.messages || [config.message]
		console.log(`Sending ${messages.length} memo(s)`)

		const results: BulkTransactionResult[] = []
		let totalSent = 0
		let totalFailed = 0

		for (let i = 0; i < messages.length; i++) {
			const message = messages[i]

			try {
				console.log(`[${i + 1}/${messages.length}] Sending memo: "${message.substring(0, 50)}${message.length > 50 ? "..." : ""}"`)

				const result = await this.sendMemoOnly({
					message,
					senderKeypair: config.senderKeypair,
					connection: config.connection,
					commitment: config.commitment,
					skipPreflight: config.skipPreflight,
				})

				if (result.success) {
					totalSent++
					results.push({
						recipientAddress: "memo-only",
						signature: result.signature,
						success: true,
						explorerUrl: result.explorerUrl,
					})
					console.log(`✅ Memo sent: ${result.signature}`)
				} else {
					totalFailed++
					results.push({
						recipientAddress: "memo-only",
						signature: "",
						success: false,
						error: result.error,
					})
					console.log(`❌ Failed to send memo: ${result.error}`)

					if (!config.continueOnError) {
						console.log("Stopping bulk memo send due to error (continueOnError=false)")
						break
					}
				}

				// Add delay between transactions if specified
				if (config.delayBetweenTx && i < messages.length - 1) {
					await new Promise((resolve) => setTimeout(resolve, config.delayBetweenTx))
				}
			} catch (error) {
				totalFailed++
				const errorMessage = error instanceof Error ? error.message : "Unknown error"
				results.push({
					recipientAddress: "memo-only",
					signature: "",
					success: false,
					error: errorMessage,
				})
				console.log(`❌ Failed to send memo: ${errorMessage}`)

				if (!config.continueOnError) {
					console.log("Stopping bulk memo send due to error (continueOnError=false)")
					break
				}
			}
		}

		const overallSuccess = totalFailed === 0

		console.log(`\n📊 Bulk memo summary:`)
		console.log(`Total sent: ${totalSent}`)
		console.log(`Total failed: ${totalFailed}`)
		console.log(`Overall success: ${overallSuccess}`)

		return {
			totalSent,
			totalFailed,
			results,
			overallSuccess,
		}
	}

	/**
	 * Sends messages to recipients from a file (recipients.txt)
	 * Reads addresses from the specified file and sends messages to all valid addresses
	 */
	async sendMessagesFromFile(config: FileRecipientConfig): Promise<BulkMessageResult> {
		console.log(`📄 Reading recipients from file: ${config.recipientsFile}`)

		try {
			// Read and validate addresses from file
			const validation = await FileUtils.readRecipientsFile(config.recipientsFile)

			// Handle validation results
			if (!validation.isValid) {
				console.error(`❌ ${validation.error}`)
				return {
					totalSent: 0,
					totalFailed: 0,
					results: [],
					overallSuccess: false,
				}
			}

			// Show warnings for invalid addresses but continue with valid ones
			FileUtils.validateRecipients(validation)

			console.log(`📋 Found ${validation.validAddresses.length} valid addresses in ${config.recipientsFile}`)

			// Convert to BulkMessageConfig and send messages
			const bulkConfig: BulkMessageConfig = {
				message: config.message,
				recipientAddresses: validation.validAddresses,
				senderKeypair: config.senderKeypair,
				connection: config.connection,
				commitment: config.commitment,
				skipPreflight: config.skipPreflight,
				delayBetweenTx: config.delayBetweenTx,
				continueOnError: config.continueOnError,
			}

			return await this.sendBulkMessages(bulkConfig)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Unknown error"
			console.error(`❌ Failed to process recipients file: ${errorMessage}`)

			return {
				totalSent: 0,
				totalFailed: 0,
				results: [],
				overallSuccess: false,
			}
		}
	}
}
