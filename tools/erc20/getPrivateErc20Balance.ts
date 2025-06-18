import { getDefaultProvider, Wallet, Contract, ethers } from '@coti-io/coti-ethers';
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { decryptUint } from '@coti-io/coti-sdk-typescript';
import { getCurrentAccountKeys, getNetwork } from "../shared/account.js";
import { ERC20_ABI } from "../constants/abis.js";

export const GET_PRIVATE_ERC20_TOKEN_BALANCE: Tool = {
    name: "get_private_erc20_balance",
    description: "Get the balance of a private ERC20 token on the COTI blockchain. This is used for checking the current balance of a private token for a COTI account. Requires a COTI account address and token contract address as input. Returns the decrypted token balance.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            },
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
        },
        required: ["account_address", "token_address"],
    },
};

/**
 * Checks if the provided arguments are valid for the getPrivateERC20TokenBalance tool
 * @param args The arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isGetPrivateERC20TokenBalanceArgs(args: unknown): args is {
    account_address: string;
    token_address: string;
} {
    if (typeof args !== "object" || args === null) {
        return false;
    }

    const { account_address, token_address } = args as Record<string, unknown>;

    if (typeof account_address !== "string" || typeof token_address !== "string") {
        return false;
    }

    if (!process.env.COTI_MCP_PUBLIC_KEY || !process.env.COTI_MCP_PRIVATE_KEY || !process.env.COTI_MCP_AES_KEY) {
        throw new Error("Missing required environment variables: COTI_MCP_PUBLIC_KEY, COTI_MCP_PRIVATE_KEY, COTI_MCP_AES_KEY");
    }

    return true;
}

/**
 * Handler for the getPrivateERC20Balance tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function getPrivateERC20BalanceHandler(args: Record<string, unknown> | undefined) {
    if (!isGetPrivateERC20TokenBalanceArgs(args)) {
        throw new Error("Invalid arguments for get_private_erc20_balance");
    }
    const { account_address, token_address } = args;

    const results = await performGetPrivateERC20TokenBalance(account_address, token_address);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}

/**
 * Gets the balance of a private ERC20 token on the COTI blockchain
 * @param account_address The COTI account address to get the balance for
 * @param token_address The ERC20 token contract address on COTI blockchain
 * @returns The decrypted token balance
 */
export async function performGetPrivateERC20TokenBalance(account_address: string, token_address: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(getNetwork());
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);

        wallet.setAesKey(currentAccountKeys.aesKey)
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const [nameResult, decimalsResult, symbolResult] = await Promise.all([
            tokenContract.name!(),
            tokenContract.decimals!(),
            tokenContract.symbol!()
        ]);
        
        const encryptedBalance = await tokenContract.balanceOf(account_address);
        
        try {
            const decryptedBalance = decryptUint(encryptedBalance, currentAccountKeys.aesKey);
            const formattedBalance = decryptedBalance ? ethers.formatUnits(decryptedBalance, decimalsResult) : "Unable to decrypt";
            
            return `Balance: ${formattedBalance}\nDecimals: ${decimalsResult}\nSymbol: ${symbolResult}\nName: ${nameResult}`;
        } catch (error) {
            console.error('Error decrypting private token balance:', error);
            throw new Error(`Failed to decrypt private token balance: ${error instanceof Error ? error.message : String(error)}`);
        }
    } catch (error) {
        console.error('Error fetching private token balance:', error);
        throw new Error(`Failed to get private token balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}


