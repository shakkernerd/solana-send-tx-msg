import { Keypair } from "@solana/web3.js"
import { getConfig } from "./config"
import { SolanaMessageSender } from "./messageSender"
import { WalletUtils } from "./walletUtils"

/**
 * Example usage of the Solana Message Sender
 */
async function defaultExample() {
	try {
		const config = getConfig()
		console.log("Default Example Starting...")
		console.log("--------------------------------\n")

		console.log("Starting in 5 seconds...")
		await new Promise((resolve) => setTimeout(resolve, 1000))
		console.log("Starting in 4 seconds...")
		await new Promise((resolve) => setTimeout(resolve, 1000))
		console.log("Starting in 3 seconds...")
		await new Promise((resolve) => setTimeout(resolve, 1000))
		console.log("Starting in 2 seconds...")
		await new Promise((resolve) => setTimeout(resolve, 1000))
		console.log("Starting in 1 second...")
		await new Promise((resolve) => setTimeout(resolve, 1000))
		console.log("�� Starting now!\n")

		console.log("🚀 Solana Message Sender Starting...")
		console.log(`Network: ${config.network}`)
		console.log(`RPC URL: ${config.rpcUrl}`)

		// Initialize the message sender
		const messageSender = new SolanaMessageSender(config)

		// Load sender keypair
		let senderKeypair: Keypair
		if (config.privateKey) {
			console.log("Loading keypair from private key...")
			senderKeypair = WalletUtils.loadKeypairFromPrivateKey(config.privateKey)
		} else if (config.walletPath) {
			console.log(`Loading keypair from file: ${config.walletPath}`)
			senderKeypair = WalletUtils.loadKeypairFromFile(config.walletPath)
		} else {
			console.log("No wallet configured, generating new keypair...")
			senderKeypair = WalletUtils.generateKeypair()
			console.log(`Generated wallet address: ${senderKeypair.publicKey.toBase58()}`)
			console.log(`Private key: ${WalletUtils.getPrivateKeyString(senderKeypair)}`)
			console.log("⚠️  Save this private key in a secure location!")
		}

		console.log(`Sender address: ${senderKeypair.publicKey.toBase58()}`)

		// Check balance
		const balance = await messageSender.getBalance(senderKeypair.publicKey)
		console.log(`Current balance: ${balance.toFixed(6)} SOL`)

		if (balance < 0.001) {
			console.log("⚠️  Low balance! You may need to fund your wallet.")
			if (config.network === "devnet") {
				console.log("💡 For devnet, you can get free SOL at: https://faucet.solana.com/")
			}
		}

		// Example 1: Send a message with small SOL transfer
		const recipientAddress = WalletUtils.toPublicKey("GXVBqMZn8B55tyVv5HgqdYLDta4eQNrH3JM1JqkJNBqs") // System program as example

		console.log("\n📨 Sending message with transfer...")
		const messageResult = await messageSender.sendMessage({
			message: "Hello from Solana! This is a test message 🚀",
			recipientAddress,
			senderKeypair,
			commitment: "confirmed",
		})

		if (messageResult.success) {
			console.log(`✅ Message sent!`)
		} else {
			console.log(`❌ Failed to send message: ${messageResult.error}`)
		}

		// Example 2: Send memo only (no transfer)
		console.log("\n📝 Sending memo only...")
		const memoResult = await messageSender.sendMemoOnly({
			message: "This is a memo-only message without any SOL transfer",
			senderKeypair,
			commitment: "confirmed",
		})

		if (memoResult.success) {
			console.log(`✅ Memo sent!`)
		} else {
			console.log(`❌ Failed to send memo: ${memoResult.error}`)
		}
	} catch (error) {
		console.error("Error in defaultExample:", error)
		process.exit(1)
	}
}

export default defaultExample
