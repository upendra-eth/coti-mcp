import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { getDefaultProvider } from "@coti-io/coti-ethers";
import { getNetwork } from "../shared/account.js";
import { z } from "zod";

export const GET_TRANSACTION_LOGS: ToolAnnotations = {
    title: "Get Transaction Logs",
    name: "get_transaction_logs",
    description:
        "Get the logs from a transaction on the COTI blockchain. " +
        "This is used for retrieving event logs emitted during transaction execution. " +
        "Requires a transaction hash as input. " +
        "Returns detailed information about the transaction logs including event names, topics, and data.",
    inputSchema: {
        transaction_hash: z.string().describe("Transaction hash to get logs for"),
    },
};

/**
 * Checks if the input arguments are valid for the get_transaction_logs tool
 * @param args The input arguments to check
 * @returns True if the arguments are valid, false otherwise
 */
export function isGetTransactionLogsArgs(args: unknown): args is { transaction_hash: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "transaction_hash" in args &&
        typeof (args as any).transaction_hash === "string"
    );
}

/**
 * Gets the logs from a transaction on the COTI blockchain
 * @param transaction_hash The hash of the transaction to get logs for
 * @returns Detailed information about the transaction logs including event names, topics, and data
 */
export async function performGetTransactionLogs(transaction_hash: string): Promise<string> {
    try {
        const provider = getDefaultProvider(getNetwork());
        let receipt;
        try {
            receipt = await provider.getTransactionReceipt(transaction_hash);
        } catch (error) {
            return `Transaction Not Found or Pending\nTransaction Hash: ${transaction_hash}\nStatus: No logs available (Transaction may be pending or not found)`;
        }

        if (!receipt) {
            return `Transaction Not Found or Pending\nTransaction Hash: ${transaction_hash}\nStatus: No logs available (Transaction may be pending or not found)`;
        }

        const logs = receipt.logs;
        
        if (!logs || logs.length === 0) {
            return `Transaction Hash: ${transaction_hash}\n\nNo logs found for this transaction.`;
        }
        
        let result = `Transaction Hash: ${transaction_hash}\n\n`;
        result += `Total Logs: ${logs.length}\n\n`;
        
        logs.forEach((log, index) => {
            result += `Log #${index + 1}:\n`;
            result += `  Address: ${log.address}\n`;
            result += `  Block Number: ${log.blockNumber}\n`;
            result += `  Transaction Index: ${log.transactionIndex}\n`;
            result += `  Log Index: ${log.index !== undefined ? log.index : 'N/A'}\n`;
            result += `  Removed: ${log.removed !== undefined ? log.removed : 'false'}\n`;
            
            result += `  Topics (${log.topics.length}):\n`;
            log.topics.forEach((topic, topicIndex) => {
                result += `    Topic ${topicIndex}: ${topic}\n`;
            });

            result += `  Data: ${log.data}\n\n`;
            
            if (log.topics.length > 0) {
                const eventSignature = log.topics[0];
                result += `  Event Signature: ${eventSignature}\n\n`;
            }
        });
        
        const network = await provider.getNetwork();
        result += `View on Explorer: https://${network.name === 'mainnet' ? 'mainnet' : 'testnet'}.cotiscan.io/tx/${transaction_hash}\n`;
        
        return result;
    } catch (error) {
        console.error('Error getting transaction logs:', error);
        throw new Error(`Failed to get transaction logs: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the getTransactionLogs tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function getTransactionLogsHandler(args: Record<string, unknown> | undefined): Promise<any> {
    if (!isGetTransactionLogsArgs(args)) {
        throw new Error("Invalid arguments for get_transaction_logs");
    }
    const { transaction_hash } = args;

    const results = await performGetTransactionLogs(transaction_hash);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}