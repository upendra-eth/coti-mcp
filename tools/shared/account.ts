export interface AccountKeys {
    privateKey: string;
    aesKey: string;
}

/**
 * Gets the current account keys from environment variables
 * @returns The private key and AES key for the current account
 */
export function getCurrentAccountKeys(): AccountKeys {
    const privateKey = process.env.COTI_PRIVATE_KEY;
    const aesKey = process.env.COTI_AES_KEY;

    if (!privateKey) {
        throw new Error("COTI_PRIVATE_KEY environment variable is not set");
    }

    if (!aesKey) {
        throw new Error("COTI_AES_KEY environment variable is not set");
    }

    return {
        privateKey,
        aesKey,
    };
}
