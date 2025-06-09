#!/usr/bin/env node

/**
 * Bulk messaging example for Solana Message Sender
 *
 * This script demonstrates how to send messages to multiple recipients
 * and how to send multiple memo-only messages.
 */

const { SolanaMessageSender, WalletUtils } = require("../dist/index.js")

async function bulkMessagingExample() {
	console.log("🚀 Solana Message Sender - Bulk Messaging Example\n")

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

		if (balance < 0.01) {
			console.log("\n💡 To use this wallet:")
			console.log("1. Copy the wallet address above")
			console.log("2. Go to https://faucet.solana.com/")
			console.log("3. Request devnet SOL for your address")
			console.log("4. Wait for the transaction to confirm")
			console.log("5. Run this script again\n")
			return
		}

		// Example 1: Send message to multiple recipients
		console.log("📨 Example 1: Bulk messaging to multiple recipients...")

		const recipients = [
			"11111111111111111111111111111112", // System program
			"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token program
			"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token program
		].map((addr) => WalletUtils.toPublicKey(addr))

		const bulkResult = await messageSender.sendBulkMessages({
			message: "Hello from bulk messaging! 🚀📨",
			recipientAddresses: recipients,
			senderKeypair,
			delayBetweenTx: 1000, // 1 second delay between transactions
			continueOnError: true, // Continue even if some fail
			commitment: "confirmed",
		})

		console.log(`\n📊 Bulk messaging results:`)
		console.log(`✅ Successful: ${bulkResult.totalSent}`)
		console.log(`❌ Failed: ${bulkResult.totalFailed}`)
		console.log(`🎯 Overall success: ${bulkResult.overallSuccess}`)

		// Show individual results
		bulkResult.results.forEach((result, index) => {
			if (result.success) {
				console.log(`  [${index + 1}] ✅ ${result.recipientAddress}: ${result.signature}`)
			} else {
				console.log(`  [${index + 1}] ❌ ${result.recipientAddress}: ${result.error}`)
			}
		})

		// Example 2: Send multiple memo-only messages
		console.log("\n📝 Example 2: Bulk memo-only messages...")

		const messages = ["First memo message! 📝", "Second memo with emojis! 🌟✨", "Third memo - testing bulk functionality! 🚀", "Final memo - bulk messaging rocks! 💯"]

		const memoResult = await messageSender.sendBulkMemoOnly({
			message: "Default message", // fallback
			messages: messages,
			senderKeypair,
			delayBetweenTx: 500, // 0.5 second delay
			continueOnError: true,
			commitment: "confirmed",
		})

		console.log(`\n📊 Bulk memo results:`)
		console.log(`✅ Successful: ${memoResult.totalSent}`)
		console.log(`❌ Failed: ${memoResult.totalFailed}`)
		console.log(`🎯 Overall success: ${memoResult.overallSuccess}`)

		// Show individual memo results
		memoResult.results.forEach((result, index) => {
			if (result.success) {
				console.log(`  [${index + 1}] ✅ Memo: ${result.signature}`)
				console.log(`      🔗 ${result.explorerUrl}`)
			} else {
				console.log(`  [${index + 1}] ❌ Memo failed: ${result.error}`)
			}
		})

		console.log("\n🎉 Bulk messaging example completed!")
		console.log("\n💡 Pro tips:")
		console.log("- Use delayBetweenTx to avoid rate limiting")
		console.log("- Set continueOnError=true for better reliability")
		console.log("- Check individual results for detailed feedback")
		console.log("- Monitor your SOL balance for bulk operations")
	} catch (error) {
		console.error("💥 Error:", error.message)
	}
}

// Run the bulk messaging example if this file is executed directly
if (require.main === module) {
	bulkMessagingExample().catch(console.error)
}

module.exports = { bulkMessagingExample }
