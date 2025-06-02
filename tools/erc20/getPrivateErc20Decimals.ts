import { getDefaultProvider, Wallet, Contract, CotiNetwork } from "@coti-io/coti-ethers";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "../shared/account.js";
import { ERC20_ABI } from "../constants/abis.js";

export const GET_PRIVATE_ERC20_DECIMALS: Tool = {
    name: "get_private_erc20_decimals",
    description:
        "Get the number of decimals for a private ERC20 token on the COTI blockchain. " +
        "This is used for checking the number of decimals in this token. " +
        "Requires token contract address as input. " +
        "Returns the number of decimals in this contract.",
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
 * Checks if the provided arguments are valid for the getPrivateERC20Decimals tool
 * @param args The arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isGetPrivateERC20DecimalsArgs(args: unknown): args is { token_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string"
    );
}

/**
 * Handler for the getPrivateERC20Decimals tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function getPrivateERC20DecimalsHandler(args: Record<string, unknown> | undefined) {
    if (!isGetPrivateERC20DecimalsArgs(args)) {
        throw new Error("Invalid arguments for get_private_erc20_decimals");
    }
    const { token_address } = args;

    const results = await performGetPrivateERC20Decimals(token_address);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}

/**
 * Performs the getPrivateERC20Decimals tool
 * @param token_address The token contract address
 * @returns The number of decimals in this contract
 */
export async function performGetPrivateERC20Decimals(token_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const currentAccountKeys = getCurrentAccountKeys();
        
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const decimals = await tokenContract.decimals();
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        
        return `Collection: ${name} (${symbol})\nDecimals: ${decimals}\nToken Address: ${token_address}`;
    } catch (error) {
        console.error('Error getting private ERC20 decimals:', error);
        throw new Error(`Failed to get private ERC20 decimals: ${error instanceof Error ? error.message : String(error)}`);
    }
}