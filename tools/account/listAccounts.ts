import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { maskSensitiveString } from "../shared/account.js";
import { getNetwork } from "../shared/account.js";
import { z } from "zod";

export const LIST_ACCOUNTS: ToolAnnotations = {
    title: "List Accounts",
    name: "list_accounts",
    description: "List all available COTI accounts configured in the environment. Returns the account addresses, current default account, and masked versions of the private and AES keys.",
    inputSchema: {}
};

/**
 * Lists all available COTI accounts configured in the environment.
 * @returns A formatted string with account information.
 */
export async function performListAccounts(): Promise<string> {
    try {
        const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',').filter(Boolean);
        const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',').filter(Boolean);
        const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',').filter(Boolean);
        const currentAccount = process.env.COTI_MCP_CURRENT_PUBLIC_KEY || publicKeys[0] || '';
        
        if (publicKeys.length === 0) {
            return "No COTI accounts configured in the environment.";
        }
        
        let result = "Available COTI Accounts on " + getNetwork() + ":\n\n";
        result += "======================\n\n";
        
        for (let i = 0; i < publicKeys.length; i++) {
            const publicKey = publicKeys[i];
            const privateKey = privateKeys[i] ? maskSensitiveString(privateKeys[i]) : "Not available";
            const aesKey = aesKeys[i] ? maskSensitiveString(aesKeys[i]) : "Not available";
            const isDefault = publicKey === currentAccount ? " (DEFAULT)" : "";
            
            result += `Account ${i + 1}${isDefault}:\n\n`;
            result += `Address: ${publicKey}\n\n`;
            result += `Private Key: ${privateKey}\n\n`;
            result += `AES Key: ${aesKey}\n\n`;
        }
        
        return result;
    } catch (error) {
        console.error('Error listing accounts:', error);
        throw new Error(`Failed to list accounts: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the listAccounts tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function listAccountsHandler(args: Record<string, unknown> | undefined): Promise<any> {
    const results = await performListAccounts();
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}