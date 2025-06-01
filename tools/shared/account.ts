export interface AccountKeys {
    privateKey: string;
    aesKey: string;
}

/**
 * Gets the account keys from environment variables
 * @param publicAddress The public address of the account
 * @returns The private key and AES key for the account
 */
export function getAccountKeys(publicAddress?: string): AccountKeys {
    const address = publicAddress || process.env.COTI_MCP_PUBLIC_KEY?.split(',')[0];
    
    if (!address) {
        throw new Error('No account address provided and no default account set');
    }
    
    const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',');
    const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',');
    const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',');
    
    const addressIndex = publicKeys.findIndex(key => 
        key.toLowerCase() === address.toLowerCase());
    
    if (addressIndex === -1 || !privateKeys[addressIndex] || !aesKeys[addressIndex]) {
        throw new Error(`No keys found for account: ${address}`);
    }
    
    return { 
        privateKey: privateKeys[addressIndex], 
        aesKey: aesKeys[addressIndex] 
    };
}


/**
 * Gets the current account keys from environment variables
 * @returns The private key and AES key for the current account
 */
export function getCurrentAccountKeys(): AccountKeys {
    return getAccountKeys(process.env.COTI_MCP_CURRENT_PUBLIC_KEY);
}

