import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDefaultProvider } from "@coti-io/coti-ethers";
import { CotiNetwork } from "@coti-io/coti-ethers";
import { Wallet } from "@coti-io/coti-ethers";

export const CREATE_ACCOUNT: Tool = {
    name: "create_account",
    description: "Create a new COTI account with a randomly generated private key and AES key. Returns the new account address, private key, and AES key.",
    inputSchema: {
        type: "object",
        properties: {
            set_as_default: {
                type: "boolean",
                description: "Optional, whether to set the new account as the default account. Default is false."
            }
        }
    }
};

/**
 * Validates the arguments for creating a new account
 * @param args The arguments to validate
 * @returns True if the arguments are valid, false otherwise
 */
export function isCreateAccountArgs(args: unknown): args is { set_as_default?: boolean } {
    return (
        typeof args === "object" &&
        args !== null &&
        (!('set_as_default' in args) || typeof (args as { set_as_default?: boolean }).set_as_default === 'boolean')
    );
}

/**
 * Creates a new COTI account with a randomly generated private key and AES key.
 * @param set_as_default Optional, whether to set the new account as the default account. Default is false.
 * @returns A formatted string with the new account address, private key, and AES key.
 */
export async function performCreateAccount(set_as_default: boolean = false): Promise<string> {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const newWallet = Wallet.createRandom(provider);
        
        const privateKey = newWallet.privateKey;
        const address = newWallet.address;
        
        const aesKey = "Fund this account to generate an AES key. Go to https://discord.com/invite/Z4r8D6ez49";
        
        const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',').filter(Boolean);
        const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',').filter(Boolean);
        const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',').filter(Boolean);
        
        publicKeys.push(address);
        privateKeys.push(privateKey);
        aesKeys.push(aesKey);
        
        process.env.COTI_MCP_PUBLIC_KEY = publicKeys.join(',');
        process.env.COTI_MCP_PRIVATE_KEY = privateKeys.join(',');
        process.env.COTI_MCP_AES_KEY = aesKeys.join(',');
        
        if (set_as_default) {
            process.env.COTI_MCP_CURRENT_PUBLIC_KEY = address;
        }
        
        return `New COTI account created successfully!\n\n` +
               `Address: ${address}\n\n` +
               `Private Key: ${privateKey}\n\n` +
               `AES Key: ${aesKey}\n\n` +
               `${set_as_default ? 'Set as default account.' : 'Not set as default account.'}`;
    } catch (error) {
        console.error('Error creating new account:', error);
        throw new Error(`Failed to create new account: ${error instanceof Error ? error.message : String(error)}`);
    }
}