#!/usr/bin/env node

/**
 * Quickstart example for Solana Message Sender
 *
 * This script demonstrates the basic usage of the message sender.
 * Run this after setting up your wallet and funding it with some SOL.
 */

const { SolanaMessageSender, WalletUtils } = require("../dist/index.js")

async function quickstart() {
	console.log("🚀 Solana Message Sender - Quickstart Example\n")

	try {
		// Initialize message sender for devnet
		const messageSender = new SolanaMessageSender({
			rpcUrl: "https://api.devnet.solana.com",
			network: "devnet",
			commitment: "confirmed",
		})

		// Generate a new keypair for this example
		// In real usage, you'd load your actual wallet
		const senderKeypair = WalletUtils.generateKeypair()
		console.log(`Generated example wallet: ${senderKeypair.publicKey.toBase58()}`)
		console.log(`Private key: ${WalletUtils.getPrivateKeyString(senderKeypair)}`)
		console.log("⚠️  This is just for demonstration - use your real wallet!\n")

		// Check balance
		const balance = await messageSender.getBalance(senderKeypair.publicKey)
		console.log(`Current balance: ${balance.toFixed(6)} SOL`)

		if (balance < 0.001) {
			console.log("\n💡 To use this wallet:")
			console.log("1. Copy the wallet address above")
			console.log("2. Go to https://faucet.solana.com/")
			console.log("3. Request devnet SOL for your address")
			console.log("4. Wait for the transaction to confirm")
			console.log("5. Run this script again\n")
			return
		}

		// Example recipient (using a well-known address)
		const recipientAddress = WalletUtils.toPublicKey("11111111111111111111111111111112")

		console.log("\n📨 Sending example message...")

		// Send a message with small SOL transfer
		const result = await messageSender.sendMessage({
			message: "Hello from Solana Message Sender! 🚀",
			recipientAddress,
			senderKeypair,
			commitment: "confirmed",
		})

		if (result.success) {
			console.log(`✅ Message sent successfully!`)
			console.log(`📝 Signature: ${result.signature}`)
			console.log(`🔗 Explorer: ${result.explorerUrl}`)
		} else {
			console.log(`❌ Failed to send message: ${result.error}`)
		}

		console.log("\n📝 Sending memo-only message...")

		// Send a memo-only message
		const memoResult = await messageSender.sendMemoOnly({
			message: "This is a memo stored on the blockchain! 📝",
			senderKeypair,
			commitment: "confirmed",
		})

		if (memoResult.success) {
			console.log(`✅ Memo sent successfully!`)
			console.log(`📝 Signature: ${memoResult.signature}`)
			console.log(`🔗 Explorer: ${memoResult.explorerUrl}`)
		} else {
			console.log(`❌ Failed to send memo: ${memoResult.error}`)
		}
	} catch (error) {
		console.error("💥 Error:", error.message)
	}
}

// Run the quickstart if this file is executed directly
if (require.main === module) {
	quickstart().catch(console.error)
}

module.exports = { quickstart }
