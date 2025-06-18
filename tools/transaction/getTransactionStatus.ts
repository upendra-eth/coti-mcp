import { ethers, getDefaultProvider } from "@coti-io/coti-ethers";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getNetwork } from "../shared/account.js";

export const GET_TRANSACTION_STATUS: Tool = {
    name: "get_transaction_status",
    description:
        "Get the status of a transaction on the COTI blockchain. " +
        "This is used for checking if a transaction has been confirmed, pending, or failed. " +
        "Requires a transaction hash as input. " +
        "Returns detailed information about the transaction status.",
    inputSchema: {
        type: "object",
        properties: {
            transaction_hash: {
                type: "string",
                description: "Transaction hash to check status for",
            }
        },
        required: ["transaction_hash"],
    },
};

/**
 * Checks if the provided arguments are valid for the get_transaction_status tool.
 * @param args The arguments to validate.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isGetTransactionStatusArgs(args: unknown): args is { transaction_hash: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "transaction_hash" in args &&
        typeof (args as any).transaction_hash === "string"
    );
}

/**
 * Performs the get_transaction_status tool.
 * @param transaction_hash The transaction hash to check status for.
 * @returns Detailed information about the transaction status.
 */
export async function performGetTransactionStatus(transaction_hash: string): Promise<string> {
    try {
        const provider = getDefaultProvider(getNetwork());
        const receipt = await provider.getTransactionReceipt(transaction_hash);
        const tx = await provider.getTransaction(transaction_hash);
        
        if (!tx) {
            return `Transaction Not Found\nTransaction Hash: ${transaction_hash}\nStatus: Unknown (Transaction not found on the blockchain)`;
        }
        
        let status = 'Pending';
        let gasUsed = 'N/A';
        let blockNumber = 'N/A';
        let confirmations = '0';
        
        if (receipt) {
            status = receipt.status ? 'Success' : 'Failed';
            gasUsed = receipt.gasUsed.toString();
            blockNumber = receipt.blockNumber.toString();
            
            const currentBlock = await provider.getBlockNumber();
            confirmations = (currentBlock - receipt.blockNumber).toString();
        }
        
        let result = `Transaction Hash: ${transaction_hash}\n\n`;
        result += `Status: ${status}\n\n`;
        result += `From: ${tx.from}\n\n`;
        result += `To: ${tx.to || 'Contract Creation'}\n\n`;
        result += `Value: ${ethers.formatEther(tx.value)} COTI\n\n`;
        result += `Gas Price: ${ethers.formatUnits(tx.gasPrice || 0, 'gwei')} Gwei\n\n`;
        result += `Gas Limit: ${tx.gasLimit.toString()}\n\n`;
        result += `Gas Used: ${gasUsed}\n\n`;
        result += `Nonce: ${tx.nonce}\n\n`;
        result += `Block Number: ${blockNumber}\n\n`;
        result += `Confirmations: ${confirmations}\n\n`;

        const network = await provider.getNetwork();
        result += `https://${network.name === 'mainnet' ? 'mainnet' : 'testnet'}.cotiscan.io/tx/${transaction_hash}\n\n`;
        
        return result;
    } catch (error) {
        console.error('Error getting transaction status:', error);
        throw new Error(`Failed to get transaction status: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the getTransactionStatus tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function getTransactionStatusHandler(args: Record<string, unknown> | undefined) {
    if (!isGetTransactionStatusArgs(args)) {
        throw new Error("Invalid arguments for get_transaction_status");
    }
    const { transaction_hash } = args;

    const results = await performGetTransactionStatus(transaction_hash);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}