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
			case "--recipients":
				// Expect comma-separated list of addresses
				options.recipients = value ? value.split(",").map((addr) => addr.trim()) : []
				break
			case "--messages":
				// Expect comma-separated list of messages for bulk memo
				options.messages = value ? value.split(",").map((msg) => msg.trim()) : []
				break
			case "--memo-only":
				options.memoOnly = true
				i-- // No value for this flag
				break
			case "--bulk":
				options.bulk = true
				i-- // No value for this flag
				break
			case "--delay":
				options.delay = parseInt(value) || 0
				break
			case "--continue-on-error":
				options.continueOnError = true
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
  
  # Bulk messaging (NEW!)
  npm run dev -- --message "Hello" --recipients <addr1>,<addr2>,<addr3> --bulk
  npm run dev -- --messages "Hello","World","!" --memo-only --bulk

Options:
  -m, --message <text>         Message to send
  -r, --recipient <addr>       Recipient address (single)
  --recipients <addr1,addr2>   Comma-separated list of recipient addresses
  --messages <msg1,msg2>       Comma-separated list of messages (for bulk memo)
  --memo-only                  Send memo without SOL transfer
  --bulk                       Enable bulk messaging mode
  --delay <ms>                 Delay between transactions in milliseconds
  --continue-on-error          Continue sending even if some transactions fail
  -h, --help                   Show this help

Examples:
  # Send to multiple recipients
  npm run dev -- --message "Hello everyone!" --recipients "addr1,addr2,addr3" --bulk
  
  # Send multiple memos
  npm run dev -- --messages "Hello","World","Test" --memo-only --bulk
  
  # Bulk send with delay and error handling
  npm run dev -- --message "Hello" --recipients "addr1,addr2" --bulk --delay 1000 --continue-on-error

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

	if (options.message || options.messages || options.bulk) {
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

			// Handle bulk messaging
			if (options.bulk || options.recipients || options.messages) {
				if (options.memoOnly) {
					// Bulk memo-only messages
					const messages = options.messages || [options.message]
					if (!messages || messages.length === 0 || messages[0] === undefined) {
						console.log("❌ No messages provided for bulk memo sending")
						showHelp()
						return
					}

					const result = await messageSender.sendBulkMemoOnly({
						message: options.message || messages[0],
						messages: messages,
						senderKeypair,
						delayBetweenTx: options.delay,
						continueOnError: options.continueOnError || false,
					})

					console.log(`\n📊 Final Results:`)
					console.log(`Successful: ${result.totalSent}`)
					console.log(`Failed: ${result.totalFailed}`)
					console.log(`Overall success: ${result.overallSuccess ? "✅" : "❌"}`)
				} else {
					// Bulk messages with SOL transfer
					if (!options.recipients || options.recipients.length === 0) {
						console.log("❌ Recipients list required for bulk message sending")
						console.log("Use --recipients addr1,addr2,addr3")
						showHelp()
						return
					}

					if (!options.message) {
						console.log("❌ Message required for bulk sending")
						showHelp()
						return
					}

					// Validate all recipient addresses
					const recipientAddresses = []
					for (const addr of options.recipients) {
						try {
							recipientAddresses.push(WalletUtils.toPublicKey(addr))
						} catch (error) {
							console.log(`❌ Invalid recipient address: ${addr}`)
							return
						}
					}

					const result = await messageSender.sendBulkMessages({
						message: options.message,
						recipientAddresses,
						senderKeypair,
						delayBetweenTx: options.delay,
						continueOnError: options.continueOnError || false,
					})

					console.log(`\n📊 Final Results:`)
					console.log(`Successful: ${result.totalSent}`)
					console.log(`Failed: ${result.totalFailed}`)
					console.log(`Overall success: ${result.overallSuccess ? "✅" : "❌"}`)
				}
			} else {
				// Single message handling (existing functionality)
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
