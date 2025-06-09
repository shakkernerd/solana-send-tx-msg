import { readFile, access } from "node:fs/promises"
import { constants } from "node:fs"
import { PublicKey } from "@solana/web3.js"
import { WalletUtils } from "./walletUtils"
import { FileValidationResult } from "./types"

export class FileUtils {
	/**
	 * Check if recipients.txt file exists and is readable
	 */
	static async checkRecipientsFile(filePath: string = "recipients.txt"): Promise<boolean> {
		try {
			await access(filePath, constants.R_OK)
			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * Read and validate addresses from recipients.txt file
	 * Expected format: one address per line, empty lines and lines starting with # are ignored
	 */
	static async readRecipientsFile(filePath: string = "recipients.txt"): Promise<FileValidationResult> {
		try {
			// Check if file exists first
			const fileExists = await this.checkRecipientsFile(filePath)
			if (!fileExists) {
				return {
					isValid: false,
					addresses: [],
					validAddresses: [],
					invalidAddresses: [],
					error: `Recipients file '${filePath}' does not exist or is not readable`,
				}
			}

			// Read file contents
			const fileContent = await readFile(filePath, { encoding: "utf8" })

			// Parse lines and filter out empty lines and comments
			const lines = fileContent
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => line.length > 0 && !line.startsWith("#"))

			if (lines.length === 0) {
				return {
					isValid: false,
					addresses: [],
					validAddresses: [],
					invalidAddresses: [],
					error: `No valid addresses found in '${filePath}'. File is empty or contains only comments.`,
				}
			}

			// Validate each address
			const validAddresses: PublicKey[] = []
			const invalidAddresses: string[] = []

			for (const address of lines) {
				try {
					const publicKey = WalletUtils.toPublicKey(address)
					validAddresses.push(publicKey)
				} catch (error) {
					invalidAddresses.push(address)
				}
			}

			const isValid = invalidAddresses.length === 0 && validAddresses.length > 0

			return {
				isValid,
				addresses: lines,
				validAddresses,
				invalidAddresses,
				error: invalidAddresses.length > 0 ? `Invalid addresses found: ${invalidAddresses.join(", ")}` : undefined,
			}
		} catch (error) {
			return {
				isValid: false,
				addresses: [],
				validAddresses: [],
				invalidAddresses: [],
				error: error instanceof Error ? error.message : "Unknown error reading recipients file",
			}
		}
	}

	/**
	 * Create a sample recipients.txt file with example addresses and comments
	 */
	static async createSampleRecipientsFile(filePath: string = "recipients.txt"): Promise<void> {
		const sampleContent = `# Recipients file for Solana Message Sender
# One address per line
# Lines starting with # are comments and will be ignored
# Empty lines are also ignored

# Example addresses (replace with real addresses):
# 11111111111111111111111111111112
# 22222222222222222222222222222223
# 33333333333333333333333333333334

# Add your recipient addresses below:
`

		const { writeFile } = await import("node:fs/promises")
		await writeFile(filePath, sampleContent, { encoding: "utf8" })
	}

	/**
	 * Validate that we have valid recipients before proceeding with operations
	 */
	static validateRecipients(validation: FileValidationResult): void {
		if (!validation.isValid) {
			throw new Error(validation.error || "Invalid recipients file")
		}

		if (validation.validAddresses.length === 0) {
			throw new Error("No valid addresses found in recipients file")
		}

		if (validation.invalidAddresses.length > 0) {
			console.warn(`⚠️  Warning: ${validation.invalidAddresses.length} invalid addresses were skipped:`)
			validation.invalidAddresses.forEach((addr) => console.warn(`   - ${addr}`))
		}
	}
}
