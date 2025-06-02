import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDefaultProvider, CotiNetwork, Contract, Wallet } from "@coti-io/coti-ethers";
import { getCurrentAccountKeys } from "../shared/account.js";
import { ERC20_ABI } from "../constants/abis.js";

export const MINT_PRIVATE_ERC20_TOKEN: Tool = {
    name: "mint_private_erc20_token",
    description:
        "Mint additional private ERC20 tokens on the COTI blockchain. " +
        "This adds new tokens to the specified recipient address. " +
        "Returns the transaction hash upon successful minting.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
            recipient_address: {
                type: "string",
                description: "Address to receive the minted tokens",
            },
            amount_wei: {
                type: "string",
                description: "Amount of tokens to mint in wei (smallest unit)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the minting transaction",
            },
        },
        required: ["token_address", "recipient_address", "amount_wei"],
    },
};

/**
 * Checks if the provided arguments are valid for minting private ERC20 tokens.
 * @param args The arguments to validate.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isMintPrivateERC20TokenArgs(args: unknown): args is { token_address: string, recipient_address: string, amount_wei: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "recipient_address" in args &&
        typeof (args as { recipient_address: string }).recipient_address === "string" &&
        "amount_wei" in args &&
        typeof (args as { amount_wei: string }).amount_wei === "string" &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}

/**
 * Performs the minting of private ERC20 tokens.
 * @param token_address The address of the ERC20 token contract.
 * @param recipient_address The address of the recipient.
 * @param amount_wei The amount of tokens to mint in wei.
 * @param gas_limit The gas limit for the transaction.
 * @returns A promise that resolves to the transaction hash.
 */
export async function performMintPrivateERC20Token(token_address: string, recipient_address: string, amount_wei: string, gas_limit?: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }
        
        const mintTx = await tokenContract.mint(recipient_address, BigInt(amount_wei), txOptions);

        const receipt = await mintTx.wait();
        
        return `ERC20 Token Minting Successful!\nToken Address: ${token_address}\nRecipient: ${recipient_address}\nAmount: ${amount_wei}\nTransaction Hash: ${receipt.hash}`;
    } catch (error) {
        console.error('Error minting private ERC20 token:', error);
        throw new Error(`Failed to mint private ERC20 token: ${error instanceof Error ? error.message : String(error)}`);
    }
}