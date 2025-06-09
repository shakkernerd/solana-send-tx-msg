import { SolanaMessageSender } from "./messageSender"
import { WalletUtils } from "./walletUtils"
import { getConfig } from "./config"
import { Keypair } from "@solana/web3.js"
import defaultExample from "./defaultExample"

// CLI argument parsing for custom messages
function parseCliArgs() {
	const args = process.argv.slice(2)
	const options: any = {}

	for (let i = 0; i < args.length; i += 2) {
		const key = args[i]
		const value = args[i + 1]

		switch (key) {
			case "--message":
			case "-m":
				options.message = value
				break
			case "--recipient":
			case "-r":
				options.recipient = value
				break
			case "--memo-only":
				options.memoOnly = true
				i-- // No value for this flag
				break
			case "--help":
			case "-h":
				showHelp()
				process.exit(0)
		}
	}

	return options
}

function showHelp() {
	console.log(`
Solana Message Sender

Usage:
  npm run dev                                    Run with default example
  npm run dev -- --message "Hello" --recipient <address>   Send custom message
  npm run dev -- --message "Hello" --memo-only             Send memo only

Options:
  -m, --message <text>     Message to send
  -r, --recipient <addr>   Recipient address
  --memo-only              Send memo without SOL transfer
  -h, --help               Show this help

Environment Variables:
  SOLANA_RPC_URL          RPC endpoint (default: devnet)
  SOLANA_NETWORK          Network: devnet/testnet/mainnet-beta
  WALLET_PATH             Path to wallet file
  PRIVATE_KEY             Base58 encoded private key
  COMMITMENT              Transaction commitment level
  `)
}

// Custom CLI execution
async function runCli() {
	const options = parseCliArgs()

	if (options.message) {
		try {
			const config = getConfig()
			console.log("🚀 Solana Message Sender Starting...")
			console.log(`Network: ${config.network}`)
			console.log(`RPC URL: ${config.rpcUrl}`)

			const messageSender = new SolanaMessageSender(config)

			let senderKeypair: Keypair
			if (config.privateKey) {
				console.log("Loading keypair from private key...")
				senderKeypair = WalletUtils.loadKeypairFromPrivateKey(config.privateKey)
			} else {
				console.log(`Loading keypair from file: ${config.walletPath}`)
				senderKeypair = WalletUtils.loadKeypairFromFile(config.walletPath)
			}

			console.log(`Sender address: ${senderKeypair.publicKey.toBase58()}`)

			if (options.memoOnly) {
				const result = await messageSender.sendMemoOnly({
					message: options.message,
					senderKeypair,
				})
				console.log(result.success ? `✅ ${result.signature}` : `❌ ${result.error}`)
			} else if (options.recipient) {
				const result = await messageSender.sendMessage({
					message: options.message,
					recipientAddress: WalletUtils.toPublicKey(options.recipient),
					senderKeypair,
				})
				console.log(result.success ? `✅ ${result.signature}` : `❌ ${result.error}`)
			} else {
				console.log("❌ Recipient address required for message sending")
				showHelp()
			}
		} catch (error) {
			console.error("❌ CLI Error:", error)
		}
	} else {
		// Run default example
		await defaultExample()
	}
}

// Run the application
if (require.main === module) {
	runCli().catch(console.error)
}

// Export for library usage
export { SolanaMessageSender, WalletUtils }
