import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, ethers } from '@coti-io/coti-ethers';

export const GET_NATIVE_BALANCE: Tool = {
    name: "get_native_balance",
    description:
        "Get the native COTI token balance of a COTI blockchain account. This is used for checking the current balance of a COTI account. Requires a COTI account address as input. Returns the account balance in COTI tokens.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            },
        },
        required: ["account_address"],
    },
};

/**
 * Gets the native COTI token balance of a COTI blockchain account
 * @param account_address The COTI account address to get the balance for
 * @returns The native COTI token balance of the account
 */
export async function performGetNativeBalance(account_address: string): Promise<string> {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const balance = await provider.getBalance(account_address);
        return `Account: ${account_address}\nBalance: ${balance} wei (${ethers.formatEther(balance)} COTI)`;
    } catch (error) {
        console.error('Error getting native balance:', error);
        throw new Error(`Failed to get native balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Checks if the provided arguments are valid for the getNativeBalance tool
 * @param args The arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isGetNativeBalanceArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as any).account_address === "string"
    );
}