import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "./shared/account.js";
import { getDefaultProvider, CotiNetwork, Wallet } from "@coti-io/coti-ethers";

export const ENCRYPT_VALUE: Tool = {
    name: "encrypt_value",
    description:
        "Encrypt a value using the COTI AES key. " +
        "This is used for encrypting values to be sent to another address. " +
        "Requires a value, contract address, and function selector as input. " +
        "Returns the signature.",
    inputSchema: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to encrypt",
            },
            contract_address: {
                type: "string",
                description: "Contract address",
            },
            function_selector: {
                type: "string",
                description: "Function selector. To get the function selector, use the keccak256 hash of the function signature. For instance, for the transfer function of an ERC20 token, the function selector is '0xa9059cbb'.",
            },
        },
        required: ["message", "contract_address", "function_selector"],
    },
};

/**
 * Checks if the provided arguments are valid for the encrypt_value tool.
 * @param args The arguments to check.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isEncryptValueArgs(args: unknown): args is { message: string, contract_address: string, function_selector: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "message" in args &&
        typeof (args as { message: string }).message === "string" &&
        "contract_address" in args &&
        typeof (args as { contract_address: string }).contract_address === "string" &&
        "function_selector" in args &&
        typeof (args as { function_selector: string }).function_selector === "string"
    );
}

/**
 * Encrypts a value using the COTI AES key.
 * @param message The message to encrypt.
 * @param contractAddress The contract address.
 * @param functionSelector The function selector.
 * @returns The encrypted message.
 */
export async function performEncryptValue(message: bigint | number | string, contractAddress: string, functionSelector: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        const encryptedMessage = await wallet.encryptValue(message, contractAddress, functionSelector);
        
        const encryptedMessageString = typeof encryptedMessage === 'object' ? 
            encryptedMessage.toString() : String(encryptedMessage);
        
        return `Encrypted Message: ${encryptedMessageString}`;
    } catch (error) {
        console.error('Error encrypting message:', error);
        throw new Error(`Failed to encrypt message: ${error instanceof Error ? error.message : String(error)}`);
    }
}