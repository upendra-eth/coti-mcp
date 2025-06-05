import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, Wallet, Contract } from '@coti-io/coti-ethers';
import { buildInputText } from '@coti-io/coti-sdk-typescript';
import { getCurrentAccountKeys } from "../shared/account.js";
import { ERC20_ABI } from "../constants/abis.js";

/**
 * Tool definition for approving a spender to use ERC20 tokens on the COTI blockchain
 */
export const APPROVE_ERC20_SPENDER: Tool = {
    name: "approve_erc20_spender",
    description:
        "Approve another address to spend tokens on behalf of the owner. " +
        "This is used for allowing another address (like a contract) to transfer your tokens. " +
        "Requires token contract address, spender address, and amount as input. " +
        "Returns the transaction hash upon successful approval.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
            spender_address: {
                type: "string",
                description: "Address to approve as spender, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            },
            amount_wei: {
                type: "string",
                description: "Amount of tokens to approve (in Wei)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the transaction",
            },
        },
        required: ["token_address", "spender_address", "amount_wei"],
    },
};

/**
 * Type guard for validating approve ERC20 spender arguments
 * @param args - Arguments to validate
 * @returns True if arguments are valid for approve ERC20 spender operation
 */
export function isApproveERC20SpenderArgs(args: unknown): args is { token_address: string, spender_address: string, amount_wei: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "spender_address" in args &&
        typeof (args as { spender_address: string }).spender_address === "string" &&
        "amount_wei" in args &&
        typeof (args as { amount_wei: string }).amount_wei === "string" &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}

/**
 * Handler for the approveERC20Spender tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function approveERC20SpenderHandler(args: Record<string, unknown> | undefined) {
    if (!isApproveERC20SpenderArgs(args)) {
        throw new Error("Invalid arguments for approve_erc20_spender");
    }
    const { token_address, spender_address, amount_wei, gas_limit } = args;

    const results = await performApproveERC20Spender(token_address, spender_address, amount_wei, gas_limit);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}

/**
 * Performs an approval for an ERC20 token spender on the COTI blockchain
 * @param token_address - Address of the ERC20 token contract
 * @param spender_address - Address of the spender to approve
 * @param amount_wei - Amount to approve in Wei
 * @param gas_limit - Optional gas limit for the transaction
 * @returns A formatted success message with transaction details
 */
export async function performApproveERC20Spender(token_address: string, spender_address: string, amount_wei: string, gas_limit?: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);

        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const symbolResult = await tokenContract.symbol();
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }

        const approveSelector = tokenContract.approve.fragment.selector;

        const encryptedInputText = buildInputText(BigInt(amount_wei), 
        { wallet: wallet, userKey: currentAccountKeys.aesKey }, token_address, approveSelector);

        const tx = await tokenContract.approve(spender_address, encryptedInputText, txOptions);
        
        const receipt = await tx.wait();

        return `ERC20 Approval Successful!\nToken: ${symbolResult}\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nSpender: ${spender_address}\nApprove Function Selector: ${approveSelector}`;
    } catch (error) {
        console.error('Error approving ERC20 spender:', error);
        throw new Error(`Failed to approve ERC20 spender: ${error instanceof Error ? error.message : String(error)}`);
    }
}
