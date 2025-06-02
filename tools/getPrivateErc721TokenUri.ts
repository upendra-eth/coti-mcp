import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "./shared/account.js";
import { Contract, getDefaultProvider, Wallet, CotiNetwork } from "@coti-io/coti-ethers";
import { ERC721_ABI } from "./constants/abis.js";

export const GET_PRIVATE_ERC721_TOKEN_URI: Tool = {
    name: "get_private_erc721_token_uri",
    description:
        "Get the tokenURI for a private ERC721 NFT token on the COTI blockchain. " +
        "This is used for retrieving the metadata URI of a private NFT. " +
        "Requires token contract address and token ID as input. " +
        "Returns the decrypted tokenURI.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            token_id: {
                type: "string",
                description: "ID of the NFT token to get the URI for",
            },
        },
        required: ["token_address", "token_id"],
    },
};

/**
 * Type guard for validating get private ERC721 token URI arguments
 * @param args - Arguments to validate
 * @returns True if arguments are valid for get private ERC721 token URI operation
 */
export function isGetPrivateERC721TokenURIArgs(args: unknown): args is { token_address: string, token_id: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "token_id" in args &&
        typeof (args as { token_id: string }).token_id === "string"
    );
}

/**
 * Gets the tokenURI for a private ERC721 NFT token on the COTI blockchain
 * @param token_address The address of the ERC721 token contract
 * @param token_id The ID of the token to get the URI for
 * @returns A formatted string with the token URI information
 */
export async function performGetPrivateERC721TokenURI(token_address: string, token_id: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const [symbolResult, nameResult] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name()
        ]);
        
        const encryptedTokenURI = await tokenContract.tokenURI(BigInt(token_id));

        let tokenURI;
        try {
            tokenURI = await wallet.decryptValue(encryptedTokenURI);
        } catch (decryptError) {
            tokenURI = decryptError;
        }
        
        return `Token: ${nameResult} (${symbolResult})\nToken ID: ${token_id}\nDecrypted Token URI: ${tokenURI}`;
    } catch (error) {
        throw new Error(`Failed to get private ERC721 token URI: ${error instanceof Error ? error.message : String(error)}`);
    }
}
