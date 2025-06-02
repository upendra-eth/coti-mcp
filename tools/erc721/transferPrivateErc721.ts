import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "../shared/account.js";
import { Contract, CotiNetwork, getDefaultProvider, Wallet } from "@coti-io/coti-ethers";
import { ERC721_ABI } from "../constants/abis.js";

export const TRANSFER_PRIVATE_ERC721_TOKEN: Tool = {
    name: "transfer_private_erc721",
    description:
        "Transfer a private ERC721 NFT token on the COTI blockchain. " +
        "This is used for sending a private NFT from your wallet to another address. " +
        "Requires token contract address, recipient address, and token ID as input. " +
        "Returns the transaction hash upon successful transfer.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            recipient_address: {
                type: "string",
                description: "Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            },
            token_id: {
                type: "string",
                description: "ID of the NFT token to transfer",
            },
            use_safe_transfer: {
                type: "boolean",
                description: "Optional, whether to use safeTransferFrom instead of transferFrom. Default is false.",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the transaction",
            },
        },
        required: ["token_address", "recipient_address", "token_id"],
    },
};


/**
 * Checks if the input arguments are valid for the transferPrivateERC721Token tool
 * @param args The input arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isTransferPrivateERC721TokenArgs(args: unknown): args is { token_address: string, recipient_address: string, token_id: string, use_safe_transfer?: boolean, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "recipient_address" in args &&
        typeof (args as { recipient_address: string }).recipient_address === "string" &&
        "token_id" in args &&
        typeof (args as { token_id: string }).token_id === "string" &&
        (!("use_safe_transfer" in args) || typeof (args as { use_safe_transfer: boolean }).use_safe_transfer === "boolean") &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}

/**
 * Transfers a private ERC721 token from the current account to another address
 * @param token_address The address of the ERC721 token contract
 * @param recipient_address The address of the recipient
 * @param token_id The ID of the token to transfer
 * @param use_safe_transfer Whether to use safeTransferFrom instead of transferFrom
 * @param gas_limit Optional gas limit for the transaction
 * @returns A string containing the transaction hash and other information
 */
export async function performTransferPrivateERC721Token(token_address: string, recipient_address: string, token_id: string, use_safe_transfer: boolean = false, gas_limit?: string) {
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
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }

        let tx;
        if (use_safe_transfer) {
            tx = await tokenContract.safeTransferFrom(wallet.address, recipient_address, token_id, txOptions);
        } else {
            tx = await tokenContract.transferFrom(wallet.address, recipient_address, token_id, txOptions);
        }
        
        const receipt = await tx.wait();
        
        return `Private NFT Transfer Successful!\nToken: ${nameResult} (${symbolResult})\nToken ID: ${token_id}\nTransaction Hash: ${receipt?.hash}\nTransfer Method: ${use_safe_transfer ? 'safeTransferFrom' : 'transferFrom'}\nRecipient: ${recipient_address}`;
    } catch (error) {
        console.error('Error transferring private ERC721 token:', error);
        throw new Error(`Failed to transfer private ERC721 token: ${error instanceof Error ? error.message : String(error)}`);
    }
}