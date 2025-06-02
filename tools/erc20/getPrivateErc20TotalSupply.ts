import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDefaultProvider, CotiNetwork, Contract, ethers, Wallet } from "@coti-io/coti-ethers";
import { getCurrentAccountKeys } from "../shared/account.js";
import { ERC20_ABI } from "../constants/abis.js";

export const GET_PRIVATE_ERC20_TOTAL_SUPPLY: Tool = {
    name: "get_private_erc20_total_supply",
    description:
        "Get the total supply of tokens for a private ERC20 token on the COTI blockchain. " +
        "This is used for checking how many tokens have been minted in this token. " +
        "Requires token contract address as input. " +
        "Returns the total number of tokens in this contract.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
        },
        required: ["token_address"],
    },
};

/**
 * Checks if the input arguments are valid for the get_private_erc20_total_supply tool
 * @param args The input arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isGetPrivateERC20TotalSupplyArgs(args: unknown): args is { token_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string"
    );
}

/**
 * Gets the total supply of tokens for a private ERC20 token on the COTI blockchain
 * @param token_address The address of the ERC20 token contract
 * @returns The total supply of tokens in this contract
 */
export async function performGetPrivateERC20TotalSupply(token_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const currentAccountKeys = getCurrentAccountKeys();
        
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const decimals = await tokenContract.decimals();
        
        const totalSupply = await tokenContract.totalSupply();
        const formattedTotalSupply = ethers.formatUnits(totalSupply, decimals);
        
        return `Collection: ${name} (${symbol})\nTotal Supply (in Wei): ${totalSupply}\nTotal Supply (formatted): ${formattedTotalSupply} (${decimals} decimals)\nToken Address: ${token_address}`;
    } catch (error) {
        console.error('Error getting private ERC20 total supply:', error);
        throw new Error(`Failed to get private ERC20 total supply: ${error instanceof Error ? error.message : String(error)}`);
    }
}