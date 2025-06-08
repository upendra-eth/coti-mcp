import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const EXPORT_ACCOUNTS: Tool = {
    name: "export_accounts",
    description: "Backup all available COTI accounts and export them as a JSON string for future import. Returns a JSON string that can be copied and used for importing later.",
    inputSchema: {
        type: "object",
        properties: {
            include_sensitive_data: {
                type: "boolean",
                description: "Whether to include sensitive data (private keys and AES keys) in the output. Default is true."
            },
            account_addresses: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Optional list of account addresses to export. If not provided, all accounts will be exported."
            }
        }
    }
};

interface ExportAccountsArgs {
    include_sensitive_data?: boolean;
    account_addresses?: string[];
}

/**
 * Type guard for ExportAccountsArgs
 * @param args The arguments to check
 * @returns Whether the arguments match the expected type
 */
function isExportAccountsArgs(args: Record<string, unknown> | undefined): args is Record<string, unknown> & ExportAccountsArgs {
    if (!args) return true;
    
    if ('include_sensitive_data' in args && typeof args.include_sensitive_data !== 'boolean' && args.include_sensitive_data !== undefined) {
        return false;
    }
    
    if ('account_addresses' in args) {
        const accountAddresses = args.account_addresses;
        if (!Array.isArray(accountAddresses)) {
            return false;
        }
        
        if (accountAddresses.some(addr => typeof addr !== 'string')) {
            return false;
        }
    }
    
    return true;
}

/**
 * Exports COTI accounts to a JSON string
 * @param args The arguments for the export
 * @returns A formatted string with the exported accounts
 */
export async function performExportAccounts(args: ExportAccountsArgs): Promise<string> {
    try {
        const includeSensitiveData = args.include_sensitive_data !== false; // Default to true if not specified
        const specificAddresses = args.account_addresses || [];
        
        const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',').filter(Boolean);
        const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',').filter(Boolean);
        const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',').filter(Boolean);
        const currentAccount = process.env.COTI_MCP_CURRENT_PUBLIC_KEY || publicKeys[0] || '';
        
        if (publicKeys.length === 0) {
            return "No COTI accounts configured in the environment. Nothing to export.";
        }
        
        let filteredIndices: number[] = [];
        
        if (specificAddresses.length > 0) {
            const normalizedSpecificAddresses = specificAddresses.map(addr => addr.toLowerCase());
            filteredIndices = publicKeys
                .map((addr, index) => ({ addr: addr.toLowerCase(), index }))
                .filter(item => normalizedSpecificAddresses.includes(item.addr))
                .map(item => item.index)
        }

        if (filteredIndices.length === 0) {
            filteredIndices = publicKeys.map((_, index) => index);
        }

        const accounts = filteredIndices.map(i => {
            let privateKey: string;
            if (!includeSensitiveData) {
                privateKey = "[REDACTED]";
            } else {
                privateKey = privateKeys[i] || "";
            }
            
            const aesKey = includeSensitiveData ? (aesKeys[i] || "") : "[REDACTED]";
            const isDefault = publicKeys[i] === currentAccount;
            
            return {
                address: publicKeys[i],
                private_key: privateKey,
                aes_key: aesKey,
                is_default: isDefault
            };
        });
        
        const backupData = {
            timestamp: new Date().toISOString(),
            accounts: accounts
        };
        
        const jsonString = JSON.stringify(backupData, null, 2);
        
        let header = "=== COTI ACCOUNTS BACKUP (JSON FORMAT) ===\n\n";
        if (specificAddresses.length > 0) {
            header = `=== COTI ACCOUNTS BACKUP (${accounts.length} of ${publicKeys.length} accounts) ===\n\n`;
        }
        
        let footer = "";
        if (includeSensitiveData) {
            footer = "\nWARNING: This backup contains sensitive information. Keep it secure and do not share it.";
        }
        
        return `${header}${jsonString}${footer}`;
    } catch (error) {
        console.error('Error exporting accounts:', error);
        throw new Error(`Failed to export accounts: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the exportAccounts tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function exportAccountsHandler(args: Record<string, unknown> | undefined) {
    if (!isExportAccountsArgs(args)) {
        return {
            content: [{ type: "text", text: "Invalid arguments provided." }],
            isError: true,
        };
    }
    
    try {
        const results = await performExportAccounts(args || {});
        return {
            content: [{ type: "text", text: results }],
            isError: false,
        };
    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
        };
    }
}
