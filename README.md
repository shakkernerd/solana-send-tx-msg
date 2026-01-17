# Solana Message Sender

TypeScript library for sending messages via Solana transactions. Messages are encoded in transaction memos and can be sent with or without SOL transfers.

## Installation

```bash
git clone https://github.com/shakkernerd/solana-send-tx-msg.git
cd solana-send-tx-msg
npm install
```

## Configuration

Set environment variables (optional):

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet  # devnet, testnet, or mainnet-beta
WALLET_PATH=~/.config/solana/id.json  # OR PRIVATE_KEY=your_base58_key
```

## Usage

### CLI

```bash
# Single message
npm run dev -- --message 'Hello!' --recipient <address>

# Memo-only (no SOL transfer)
npm run dev -- --message 'Memo' --memo-only

# Bulk messaging
npm run dev -- --message 'Hello!' --recipients "addr1,addr2,addr3" --bulk

# File-based recipients
npm run dev -- --create-sample  # Create template
npm run dev -- --message 'Hello!' --recipients-file recipients.txt

# Options
npm run dev -- --message 'Hello' --bulk --delay 1000 --continue-on-error
```

**Note:** Use single quotes for messages with spaces.

### Programmatic

```typescript
import { SolanaMessageSender, WalletUtils } from "./src/index"

const messageSender = new SolanaMessageSender({
  rpcUrl: "https://api.devnet.solana.com",
  network: "devnet",
})

const senderKeypair = WalletUtils.loadKeypairFromFile("./wallet.json")

// Single message
const result = await messageSender.sendMessage({
  message: "Hello!",
  recipientAddress: WalletUtils.toPublicKey("target-address"),
  senderKeypair,
})

// Bulk messages
const recipients = ["addr1", "addr2"].map(addr => WalletUtils.toPublicKey(addr))
const bulkResult = await messageSender.sendBulkMessages({
  message: "Hello everyone!",
  recipientAddresses: recipients,
  senderKeypair,
  delayBetweenTx: 1000,
  continueOnError: true,
})

// File-based
await messageSender.sendMessagesFromFile({
  message: "Hello!",
  recipientsFile: "recipients.txt",
  senderKeypair,
})
```

## Recipients File Format

One address per line. Comments (`#`) and empty lines are ignored:

```txt
# Example
11111111111111111111111111111112
So11111111111111111111111111111111111111112
```

## API

### SolanaMessageSender

- `sendMessage(config)` - Send message with SOL transfer
- `sendMemoOnly(config)` - Send memo-only message
- `sendBulkMessages(config)` - Send to multiple recipients
- `sendBulkMemoOnly(config)` - Send multiple memo-only messages
- `sendMessagesFromFile(config)` - Send to recipients from file

### WalletUtils

- `loadKeypairFromFile(path?)` - Load keypair from file
- `loadKeypairFromPrivateKey(key)` - Load from base58 private key
- `generateKeypair()` - Generate new keypair
- `toPublicKey(address)` - Convert string to PublicKey
- `isValidPublicKey(address)` - Validate address

### FileUtils

- `readRecipientsFile(path?)` - Read and validate addresses from file
- `createSampleRecipientsFile(path?)` - Create template file

## Wallet Setup

1. **Solana CLI**: `solana-keygen new --outfile ~/.config/solana/id.json`
2. **Private Key**: Set `PRIVATE_KEY` environment variable
3. **Auto-generate**: Application generates one if none configured

## Getting SOL

- **Devnet**: [Solana Faucet](https://faucet.solana.com/)
- **Testnet**: `solana airdrop 1 <address> --url testnet`

## Troubleshooting

- **Insufficient funds**: Get SOL from faucet, check balance
- **Invalid address**: Verify it's a valid Solana public key
- **RPC issues**: Check connection, try different endpoint
- **Command hanging**: Use single quotes for messages with spaces

## Development

```bash
npm run build    # Build
npm start        # Run built version
npm run clean    # Clean build files
```

## License

MIT License - feel free to use this project for any purpose.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
---

Built with ❤️ for the Solana ecosystem

