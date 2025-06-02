import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getAccountKeys } from "../shared/account.js";

export const CHANGE_DEFAULT_ACCOUNT: Tool = {
    name: "change_default_account",
    description: "Change the default account used for COTI blockchain operations. This allows switching between different accounts configured in the environment. The account must be configured in the environment variables with corresponding private and AES keys. Returns the new default account address upon successful change.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address to set as default, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273"
            }
        },
        required: ["account_address"]
    }
};

/**
 * Validates the arguments for changing the default account
 * @param args The arguments to validate
 * @returns True if the arguments are valid, false otherwise
 */
export function isChangeDefaultAccountArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as { account_address: string }).account_address === "string"
    );
}

/**
 * Changes the default account used for COTI blockchain operations.
 * @param account_address The COTI account address to set as default
 * @returns A formatted string with the new default account address
 */
export async function performChangeDefaultAccount(account_address: string) {
    try {
        const accountKeys = getAccountKeys(account_address);
        
        if (!accountKeys) {
            throw new Error(`Account ${account_address} not found`);
        }
        
        process.env.COTI_MCP_CURRENT_PUBLIC_KEY = account_address;
        
        return `Default account successfully changed to: ${account_address}`;
    } catch (error) {
        console.error('Error changing default account:', error);
        throw new Error(`Failed to change default account: ${error instanceof Error ? error.message : String(error)}`);
    }
}