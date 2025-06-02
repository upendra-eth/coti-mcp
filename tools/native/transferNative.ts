import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, Wallet } from '@coti-io/coti-ethers';
import { getCurrentAccountKeys } from "../shared/account.js";

export const TRANSFER_NATIVE: Tool = {
    name: "transfer_native",
    description:
        "Transfer native COTI tokens to another wallet. " +
        "This is used for sending COTI tokens from your wallet to another address. " +
        "Requires recipient address and amount in Wei as input. " +
        "Returns the transaction hash upon successful transfer.",
    inputSchema: {
        type: "object",
        properties: {
            recipient_address: {
                type: "string",
                description: "Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            },
            amount_wei: {
                type: "string",
                description: "Amount of COTI to transfer (in Wei)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the transaction",
            },
        },
        required: ["recipient_address", "amount_wei"],
    },
};

/**
 * Transfers native COTI tokens to another wallet
 * @param recipient_address The recipient COTI address
 * @param amount_wei The amount of COTI to transfer (in Wei)
 * @param gas_limit Optional gas limit for the transaction
 * @returns The transaction hash upon successful transfer
 */
export async function performTransferNative(recipient_address: string, amount_wei: string, gas_limit?: string): Promise<string> {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }
        
        const tx = await wallet.sendTransaction({
            to: recipient_address,
            value: amount_wei,
            ...txOptions
        });
        
        const receipt = await tx.wait();
        
        return `Transaction successful!\nToken: COTI\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nRecipient: ${recipient_address}`;
    } catch (error) {
        console.error('Error transferring COTI tokens:', error);
        throw new Error(`Failed to transfer COTI tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Checks if the provided arguments are valid for the transferNative tool
 * @param args The arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isTransferNativeArgs(args: unknown): args is { recipient_address: string, amount_wei: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "recipient_address" in args &&
        typeof (args as { recipient_address: string }).recipient_address === "string" &&
        "amount_wei" in args &&
        typeof (args as { amount_wei: string }).amount_wei === "string" &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}