# Solana Message Sender

A TypeScript project for sending messages using transactions on the Solana blockchain. This tool allows you to send messages encoded in transaction memos, either with or without SOL transfers.

## Features

-   📨 Send messages to specific addresses with small SOL transfers
-   📝 Send memo-only messages without any SOL transfer
-   🚀 **NEW: Bulk messaging to multiple recipients**
-   📋 **NEW: Send multiple memo-only messages in batch**
-   📄 **NEW: File-based recipients - send to addresses from a text file**
-   ✅ **NEW: Address validation and file parsing with error handling**
-   💼 Support for multiple wallet loading methods (file, private key, or generate new)
-   🌐 Configurable for devnet, testnet, or mainnet-beta
-   🔍 Automatic balance checking and validation
-   🔗 Direct links to Solana Explorer for transaction viewing
-   ⚡ CLI interface for quick message sending
-   ⏱️ Configurable delays between transactions to avoid rate limiting
-   🛡️ Error handling with continue-on-error option

## Installation

1. Clone the repository:

```bash
git clone https://github.com/shakkernerd/solana-send-tx-msg.git
cd solana-send-tx-msg
```

2. Install dependencies:

```bash
npm install
```

3. Set up your environment (optional):

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

The project can be configured using environment variables:

```bash
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet  # devnet, testnet, or mainnet-beta

# Wallet Configuration (choose one)
WALLET_PATH=~/.config/solana/id.json  # Path to Solana CLI wallet
# OR
PRIVATE_KEY=your_base58_private_key_here

# Transaction Configuration
COMMITMENT=confirmed
SKIP_PREFLIGHT=false
```

## Usage

### 1. Basic Usage (Development)

Run the example with default settings:

```bash
npm run dev
```

This will:

-   Load or generate a wallet
-   Check the balance
-   Send a test message with transfer
-   Send a memo-only message

### 2. CLI Usage

Send a custom message to a specific address:

```bash
npm run dev -- --message "Hello from Solana!" --recipient <recipient-address>
```

Send a memo-only message (no SOL transfer):

```bash
npm run dev -- --message "This is a memo" --memo-only
```

**NEW: Bulk messaging to multiple recipients:**

```bash
npm run dev -- --message "Hello everyone!" --recipients "addr1,addr2,addr3" --bulk
```

**NEW: Send multiple memo-only messages:**

```bash
npm run dev -- --messages "Hello","World","Test" --memo-only --bulk
```

**Bulk messaging with advanced options:**

```bash
npm run dev -- --message "Hello" --recipients "addr1,addr2" --bulk --delay 1000 --continue-on-error
```

**NEW: File-based recipients:**

```bash
# Create a sample recipients.txt file
npm run dev -- --create-sample

# Send to addresses from recipients.txt
npm run dev -- --message "Hello everyone!" --recipients-file recipients.txt

# Send from custom file with options
npm run dev -- --message "Hello" --recipients-file my-list.txt --delay 1000 --continue-on-error
```

Show help:

```bash
npm run dev -- --help
```

### 3. Programmatic Usage

**Single message:**

```typescript
import { SolanaMessageSender, WalletUtils } from "./src/index"

async function sendMessage() {
	// Initialize message sender
	const messageSender = new SolanaMessageSender({
		rpcUrl: "https://api.devnet.solana.com",
		network: "devnet",
	})

	// Load wallet
	const senderKeypair = WalletUtils.loadKeypairFromFile("./wallet.json")

	// Send message with transfer
	const result = await messageSender.sendMessage({
		message: "Hello from my app!",
		recipientAddress: WalletUtils.toPublicKey("target-address"),
		senderKeypair,
		commitment: "confirmed",
	})

	if (result.success) {
		console.log(`Message sent! Signature: ${result.signature}`)
		console.log(`Explorer: ${result.explorerUrl}`)
	}
}
```

**NEW: Bulk messaging:**

```typescript
import { SolanaMessageSender, WalletUtils } from "./src/index"

async function sendBulkMessages() {
	const messageSender = new SolanaMessageSender({
		rpcUrl: "https://api.devnet.solana.com",
		network: "devnet",
	})

	const senderKeypair = WalletUtils.loadKeypairFromFile("./wallet.json")

	// Send to multiple recipients
	const recipients = ["address1...", "address2...", "address3..."].map((addr) => WalletUtils.toPublicKey(addr))

	const result = await messageSender.sendBulkMessages({
		message: "Hello everyone!",
		recipientAddresses: recipients,
		senderKeypair,
		delayBetweenTx: 1000, // 1 second delay
		continueOnError: true, // Don't stop on errors
		commitment: "confirmed",
	})

	console.log(`Sent: ${result.totalSent}, Failed: ${result.totalFailed}`)

	// Check individual results
	result.results.forEach((res, i) => {
		if (res.success) {
			console.log(`✅ [${i + 1}] ${res.signature}`)
		} else {
			console.log(`❌ [${i + 1}] ${res.error}`)
		}
	})
}
```

**NEW: File-based recipients:**

```typescript
import { SolanaMessageSender, WalletUtils, FileUtils } from "./src/index"

async function sendFromFile() {
	const messageSender = new SolanaMessageSender({
		rpcUrl: "https://api.devnet.solana.com",
		network: "devnet",
	})

	const senderKeypair = WalletUtils.loadKeypairFromFile("./wallet.json")

	// Send to addresses from file
	const result = await messageSender.sendMessagesFromFile({
		message: "Hello from file!",
		recipientsFile: "recipients.txt",
		senderKeypair,
		delayBetweenTx: 1000,
		continueOnError: true,
	})

	console.log(`Sent: ${result.totalSent}, Failed: ${result.totalFailed}`)
}

// You can also manually read and validate the file
async function validateRecipientsFile() {
	const validation = await FileUtils.readRecipientsFile("recipients.txt")

	if (validation.isValid) {
		console.log(`Found ${validation.validAddresses.length} valid addresses`)
		if (validation.invalidAddresses.length > 0) {
			console.warn(`Skipped ${validation.invalidAddresses.length} invalid addresses`)
		}
	} else {
		console.error(`File validation failed: ${validation.error}`)
	}
}
```

## File-Based Recipients

### Recipients File Format

The recipients file supports a simple text format with one address per line:

```txt
# Recipients file for Solana Message Sender
# Lines starting with # are comments and will be ignored
# Empty lines are also ignored

# Example addresses (replace with real addresses):
11111111111111111111111111111112
So11111111111111111111111111111111111111112
TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA

# Add your recipient addresses below:
YourRecipientAddress1Here...
YourRecipientAddress2Here...
```

### Creating a Recipients File

**Option 1: Use the built-in generator**

```bash
npm run dev -- --create-sample
```

This creates a `recipients.txt` template with instructions and examples.

**Option 2: Create manually**

Create a text file with one Solana address per line. Comments (starting with #) and empty lines are ignored.

### File Validation

The system automatically validates all addresses in the file:

-   ✅ **Valid addresses**: Added to the recipient list
-   ⚠️ **Invalid addresses**: Skipped with warnings (continues with valid ones)
-   ❌ **File errors**: Clear error messages for missing files or read errors

### Usage Examples

**Basic usage:**

```bash
npm run dev -- --message "Hello!" --recipients-file recipients.txt
```

**With custom file:**

```bash
npm run dev -- --message "Hello!" --recipients-file ./my-addresses.txt
```

**With error handling options:**

```bash
npm run dev -- --message "Hello!" --recipients-file recipients.txt --continue-on-error --delay 2000
```

### File Utility Methods

```typescript
// Check if file exists and is readable
const exists = await FileUtils.checkRecipientsFile("recipients.txt")

// Read and validate all addresses
const validation = await FileUtils.readRecipientsFile("recipients.txt")

// Create a sample file
await FileUtils.createSampleRecipientsFile("my-recipients.txt")

// Validate addresses (throws error if invalid)
FileUtils.validateRecipients(validation)
```

## Wallet Setup

### Option 1: Use Solana CLI Wallet

If you have Solana CLI installed:

```bash
solana-keygen new --outfile ~/.config/solana/id.json
```

### Option 2: Use Private Key

Set the `PRIVATE_KEY` environment variable with your base58 encoded private key.

### Option 3: Generate New Wallet

If no wallet is configured, the application will generate a new one automatically.

## Getting SOL for Testing

### Devnet (Free)

Visit the [Solana Faucet](https://faucet.solana.com/) to get free devnet SOL.

### Testnet

Use the Solana CLI:

```bash
solana airdrop 1 <your-address> --url testnet
```

## How It Works

### Message with Transfer

1. Creates a transaction with two instructions:
    - Memo instruction containing your message
    - System transfer instruction (small amount of SOL)
2. Signs and sends the transaction
3. Returns the transaction signature and explorer URL

### Memo Only

1. Creates a transaction with only a memo instruction
2. No SOL transfer involved
3. Still requires transaction fees (very small amount)

## Project Structure

```
src/
├── index.ts          # Main entry point and CLI
├── messageSender.ts  # Core message sending functionality
├── walletUtils.ts    # Wallet loading and validation utilities
├── fileUtils.ts      # File-based recipients handling utilities
├── config.ts         # Configuration management
└── types.ts          # TypeScript type definitions
```

## API Reference

### SolanaMessageSender

#### Methods

-   `sendMessage(config: MessageConfig)` - Send message with SOL transfer
-   `sendMemoOnly(config: MemoConfig)` - Send memo-only message
-   `sendBulkMessages(config: BulkMessageConfig)` - **NEW: Send messages to multiple recipients**
-   `sendBulkMemoOnly(config: BulkMemoConfig)` - **NEW: Send multiple memo-only messages**
-   `sendMessagesFromFile(config: FileRecipientConfig)` - **NEW: Send messages to recipients from file**
-   `getBalance(publicKey: PublicKey)` - Get wallet balance in SOL
-   `checkBalance(publicKey: PublicKey, required?: number)` - Check if wallet has sufficient balance

#### New Bulk Message Interfaces

```typescript
interface BulkMessageConfig {
	message: string
	recipientAddresses: PublicKey[]
	senderKeypair: Keypair
	connection?: Connection
	commitment?: "processed" | "confirmed" | "finalized"
	skipPreflight?: boolean
	delayBetweenTx?: number // milliseconds delay between transactions
	continueOnError?: boolean // continue sending even if some fail
}

interface BulkMessageResult {
	totalSent: number
	totalFailed: number
	results: BulkTransactionResult[]
	overallSuccess: boolean
}

interface BulkTransactionResult {
	recipientAddress: string
	signature: string
	success: boolean
	error?: string
	explorerUrl?: string
}

// NEW: File-based recipient interfaces
interface FileRecipientConfig extends Omit<BulkMessageConfig, "recipientAddresses"> {
	recipientsFile: string
}

interface FileValidationResult {
	isValid: boolean
	addresses: string[]
	validAddresses: PublicKey[]
	invalidAddresses: string[]
	error?: string
}
```

### WalletUtils

#### Static Methods

-   `loadKeypairFromFile(path?: string)` - Load keypair from file
-   `loadKeypairFromPrivateKey(privateKey: string)` - Load keypair from base58 private key
-   `generateKeypair()` - Generate new random keypair
-   `getPrivateKeyString(keypair: Keypair)` - Get base58 private key from keypair
-   `isValidPublicKey(address: string)` - Validate Solana address
-   `toPublicKey(address: string)` - Convert string to PublicKey with validation

### FileUtils

#### Static Methods

-   `checkRecipientsFile(filePath?: string)` - Check if recipients file exists and is readable
-   `readRecipientsFile(filePath?: string)` - Read and validate addresses from file
-   `createSampleRecipientsFile(filePath?: string)` - Create a template recipients file
-   `validateRecipients(validation: FileValidationResult)` - Validate file parsing results (throws on error)

## Examples

### Run the Bulk Messaging Example

```bash
npm run bulk-example
```

### Send Message to Multiple Recipients (OLD WAY - Sequential)

```typescript
const recipients = ["Address1...", "Address2...", "Address3..."]

for (const recipient of recipients) {
	const result = await messageSender.sendMessage({
		message: `Hello ${recipient}!`,
		recipientAddress: WalletUtils.toPublicKey(recipient),
		senderKeypair,
	})

	console.log(`Sent to ${recipient}: ${result.signature}`)
}
```

### Send Message to Multiple Recipients (NEW WAY - Bulk)

```typescript
const recipients = ["Address1...", "Address2...", "Address3..."].map((addr) => WalletUtils.toPublicKey(addr))

const result = await messageSender.sendBulkMessages({
	message: "Hello everyone!",
	recipientAddresses: recipients,
	senderKeypair,
	delayBetweenTx: 1000,
	continueOnError: true,
})

console.log(`✅ Sent: ${result.totalSent}, ❌ Failed: ${result.totalFailed}`)
```

### Batch Memo Messages (OLD WAY - Sequential)

```typescript
const messages = ["Message 1", "Message 2", "Message 3"]

for (const message of messages) {
	await messageSender.sendMemoOnly({
		message,
		senderKeypair,
	})
}
```

### Batch Memo Messages (NEW WAY - Bulk)

```typescript
const messages = ["Message 1", "Message 2", "Message 3"]

const result = await messageSender.sendBulkMemoOnly({
	message: "Default message",
	messages: messages,
	senderKeypair,
	delayBetweenTx: 500,
	continueOnError: true,
})

console.log(`✅ Sent: ${result.totalSent}, ❌ Failed: ${result.totalFailed}`)
```

### File-Based Recipients (NEW WAY)

```typescript
// Create a sample recipients file
await FileUtils.createSampleRecipientsFile("my-recipients.txt")

// Edit the file to add your addresses, then:
const result = await messageSender.sendMessagesFromFile({
	message: "Hello from file!",
	recipientsFile: "my-recipients.txt",
	senderKeypair,
	delayBetweenTx: 1000,
	continueOnError: true,
})

console.log(`📄 File-based sending complete:`)
console.log(`✅ Sent: ${result.totalSent}, ❌ Failed: ${result.totalFailed}`)

// Manual file validation
const validation = await FileUtils.readRecipientsFile("my-recipients.txt")
if (validation.isValid) {
	console.log(`📋 Found ${validation.validAddresses.length} valid addresses`)
	if (validation.invalidAddresses.length > 0) {
		console.warn(`⚠️ Skipped ${validation.invalidAddresses.length} invalid addresses`)
	}
}
```

## Security Notes

-   Never commit private keys to version control
-   Use environment variables for sensitive data
-   Test on devnet before using mainnet
-   Keep your private keys secure and backed up

## Troubleshooting

### Common Issues

1. **"Insufficient funds" error**

    - Check your wallet balance
    - Get devnet SOL from the faucet
    - Ensure you have enough for transaction fees

2. **"Invalid address" error**

    - Verify the recipient address is a valid Solana public key
    - Use the `WalletUtils.isValidPublicKey()` method to validate

3. **RPC connection issues**

    - Check your internet connection
    - Try a different RPC endpoint
    - Verify the network configuration

4. **File-based recipients issues**
    - Ensure the recipients file exists and is readable
    - Check file format: one address per line
    - Verify all addresses are valid Solana public keys
    - Use `--create-sample` to generate a template file

## Development

Build the project:

```bash
npm run build
```

Run the built version:

```bash
npm start
```

Clean build files:

```bash
npm run clean
```

## License

MIT License - feel free to use this project for any purpose.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

Built with ❤️ for the Solana ecosystem
