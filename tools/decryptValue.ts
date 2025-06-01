import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "./shared/account.js";
import { getDefaultProvider, CotiNetwork, Wallet } from "@coti-io/coti-ethers";

export const DECRYPT_VALUE: Tool = {
    name: "decrypt_value",
    description:
        "Decrypt a value using the COTI AES key. " +
        "Requires a ciphertext as input. " +
        "Returns the decrypted value.",
    inputSchema: {
        type: "object",
        properties: {
            ciphertext: {
                type: "string",
                description: "Ciphertext to decrypt",
            },
        },
        required: ["ciphertext"],
    },
};

/**
 * Checks if the provided arguments are valid for the decrypt_value tool.
 * @param args The arguments to check.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isDecryptValueArgs(args: unknown): args is { ciphertext: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "ciphertext" in args &&
        typeof (args as { ciphertext: string }).ciphertext === "string"
    );
}

/**
 * Decrypts a value using the COTI AES key.
 * @param ciphertext The ciphertext to decrypt.
 * @returns The decrypted value.
 */
export async function performDecryptValue(ciphertext: bigint) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        const decryptedMessage = await wallet.decryptValue(ciphertext);
        
        return `Decrypted Message: ${decryptedMessage}`;
    } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error(`Failed to decrypt message: ${error instanceof Error ? error.message : String(error)}`);
    }
}