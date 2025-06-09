## Bulk Messaging Overview

The Solana Message Sender now supports **bulk messaging** - the ability to send messages to multiple recipients efficiently with proper error handling and configuration options.

### 1. Bulk Message Sending

-   Send the same message to multiple recipients with SOL transfers
-   Configurable delays between transactions to avoid rate limiting
-   Continue-on-error option for better reliability
-   Detailed results tracking for each recipient

### 2. Bulk Memo-Only Messages

-   Send multiple memo-only messages without SOL transfers
-   Support for different messages in each memo
-   Perfect for blockchain logging or announcements

### 3. Advanced Configuration Options

-   `delayBetweenTx`: Milliseconds delay between transactions
-   `continueOnError`: Continue processing even if some transactions fail
-   Comprehensive result tracking with success/failure counts

## 🛠️ API Reference

### New Methods

#### `sendBulkMessages(config: BulkMessageConfig)`

Sends messages with SOL transfers to multiple recipients.

```typescript
const result = await messageSender.sendBulkMessages({
	message: "Hello everyone!",
	recipientAddresses: [address1, address2, address3],
	senderKeypair,
	delayBetweenTx: 1000,
	continueOnError: true,
})
```

#### `sendBulkMemoOnly(config: BulkMemoConfig)`

Sends multiple memo-only messages.

```typescript
const result = await messageSender.sendBulkMemoOnly({
	messages: ["Memo 1", "Memo 2", "Memo 3"],
	senderKeypair,
	delayBetweenTx: 500,
	continueOnError: true,
})
```

### New Interfaces

```typescript
interface BulkMessageConfig {
	message: string
	recipientAddresses: PublicKey[]
	senderKeypair: Keypair
	connection?: Connection
	commitment?: "processed" | "confirmed" | "finalized"
	skipPreflight?: boolean
	delayBetweenTx?: number
	continueOnError?: boolean
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
```

## 🖥️ CLI Usage

### Send to Multiple Recipients

```bash
npm run dev -- --message "Hello everyone!" --recipients "addr1,addr2,addr3" --bulk
```

### Send Multiple Memos

```bash
npm run dev -- --messages "Hello","World","Test" --memo-only --bulk
```

### With Advanced Options

```bash
npm run dev -- --message "Hello" --recipients "addr1,addr2" --bulk --delay 1000 --continue-on-error
```

## 📊 Result Tracking

The bulk messaging features provide comprehensive feedback:

```typescript
{
    totalSent: 3,
    totalFailed: 1,
    results: [
        {
            recipientAddress: "addr1...",
            signature: "signature1...",
            success: true,
            explorerUrl: "https://explorer.solana.com/tx/signature1..."
        },
        {
            recipientAddress: "addr2...",
            signature: "",
            success: false,
            error: "Insufficient funds"
        }
        // ... more results
    ],
    overallSuccess: false
}
```

## 🎯 Benefits

1. **Efficiency**: Process multiple transactions with proper spacing
2. **Reliability**: Continue processing even if some transactions fail
3. **Monitoring**: Detailed success/failure tracking for each transaction
4. **Rate Limiting**: Built-in delays to avoid overwhelming the network
5. **User Experience**: Clear progress updates and final summaries

## 🧪 Testing

Run the bulk messaging example:

```bash
npm run bulk-example
```

This will demonstrate:

-   Sending to multiple recipients
-   Bulk memo-only messages
-   Error handling and result tracking
-   Progress monitoring

## 📋 Best Practices

1. **Use `delayBetweenTx`** to avoid rate limiting (recommended: 500-2000ms)
2. **Set `continueOnError: true`** for better reliability in bulk operations
3. **Monitor your SOL balance** before bulk operations
4. **Check individual results** for detailed feedback
5. **Test on devnet** before using on mainnet

## 🔧 Implementation Details

-   Each transaction is processed sequentially to maintain order
-   Proper error handling prevents one failure from stopping the entire batch
-   Explorer URLs are generated for all successful transactions
-   Memory-efficient processing without storing all transactions in memory simultaneously

---

Built with ❤️ for efficient Solana messaging!
