import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys, getNetwork } from "../shared/account.js";
import { Contract, getDefaultProvider, Wallet } from "@coti-io/coti-ethers";
import { ERC721_ABI } from "../constants/abis.js";

export const GET_PRIVATE_ERC721_TOKEN_OWNER: Tool = {
    name: "get_private_erc721_token_owner",
    description:
        "Get the owner address of a private ERC721 NFT token on the COTI blockchain. " +
        "This is used for checking who currently owns a specific NFT. " +
        "Requires token contract address and token ID as input. " +
        "Returns the owner's address of the specified NFT.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            token_id: {
                type: "string",
                description: "ID of the NFT token to check ownership for",
            },
        },
        required: ["token_address", "token_id"],
    },
};

/**
 * Checks if the provided arguments are valid for the get_private_erc721_token_owner tool.
 * @param args The arguments to validate
 * @returns true if the arguments are valid, false otherwise
 */
export function isGetPrivateERC721TokenOwnerArgs(args: unknown): args is { token_address: string, token_id: string } {
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
 * Handler for the getPrivateERC721TokenOwner tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function getPrivateERC721TokenOwnerHandler(args: Record<string, unknown> | undefined) {
    if (!isGetPrivateERC721TokenOwnerArgs(args)) {
        throw new Error("Invalid arguments for get_private_erc721_token_owner");
    }
    const { token_address, token_id } = args;

    const results = await performGetPrivateERC721TokenOwner(token_address, token_id);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}

/**
 * Gets the owner address of a private ERC721 NFT token
 * @param token_address The address of the ERC721 token contract
 * @param token_id The ID of the token to check ownership for
 * @returns A formatted string with the token owner information
 */
export async function performGetPrivateERC721TokenOwner(token_address: string, token_id: string) {
    try {
        const provider = getDefaultProvider(getNetwork());
        const currentAccountKeys = getCurrentAccountKeys();
        
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        
        const ownerAddress = await tokenContract.ownerOf(token_id);
        
        return `Token: ${name} (${symbol})\nToken ID: ${token_id}\nOwner Address: ${ownerAddress}`;
    } catch (error) {
        console.error('Error getting private ERC721 token owner:', error);
        throw new Error(`Failed to get private ERC721 token owner: ${error instanceof Error ? error.message : String(error)}`);
    }
}