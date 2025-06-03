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
            }
        }
    }
};

interface ExportAccountsArgs {
    include_sensitive_data?: boolean;
}

/**
 * Type guard for ExportAccountsArgs
 * @param args The arguments to check
 * @returns Whether the arguments match the expected type
 */
function isExportAccountsArgs(args: Record<string, unknown> | undefined): args is Record<string, unknown> & ExportAccountsArgs {
    if (!args) return true; // No args is valid
    
    if ('include_sensitive_data' in args && typeof args.include_sensitive_data !== 'boolean' && args.include_sensitive_data !== undefined) {
        return false;
    }
    
    return true;
}

/**
 * Exports all available COTI accounts to a JSON string
 * @param args The arguments for the export
 * @returns 
 */
export async function performExportAccounts(args: ExportAccountsArgs): Promise<string> {
    try {
        const includeSensitiveData = args.include_sensitive_data !== false; // Default to true if not specified
        
        const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',').filter(Boolean);
        const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',').filter(Boolean);
        const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',').filter(Boolean);
        const currentAccount = process.env.COTI_MCP_CURRENT_PUBLIC_KEY || publicKeys[0] || '';
        
        if (publicKeys.length === 0) {
            return "No COTI accounts configured in the environment. Nothing to export.";
        }
        
        const accounts = publicKeys.map((publicKey, i) => {
            const privateKey = includeSensitiveData ? (privateKeys[i] || "") : "[REDACTED]";
            const aesKey = includeSensitiveData ? (aesKeys[i] || "") : "[REDACTED]";
            const isDefault = publicKey === currentAccount;
            
            return {
                address: publicKey,
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
        return `=== COTI ACCOUNTS BACKUP (JSON FORMAT) ===\n\n${jsonString}\n\n${includeSensitiveData ? "WARNING: This backup contains sensitive information. Keep it secure and do not share it." : ""}`;
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
