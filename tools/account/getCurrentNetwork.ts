import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export const GET_CURRENT_NETWORK: ToolAnnotations = {
    title: "Get Current Network",
    name: "get_current_network",
    description: "Get the currently configured COTI network (testnet or mainnet). Returns the network that all blockchain operations will use.",
    inputSchema: {}
};

/**
 * Gets the currently configured COTI network.
 * @returns A formatted string with the current network
 */
export async function performGetCurrentNetwork(): Promise<string> {
    try {
        const network = process.env.COTI_MCP_NETWORK?.toLowerCase() || 'testnet';
        
        return `Current network: ${network}`;
    } catch (error) {
        console.error('Error getting current network:', error);
        throw new Error(`Failed to get current network: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the getCurrentNetwork tool
 * @param args The arguments for the tool (none required)
 * @returns The tool response
 */
export async function getCurrentNetworkHandler(args: Record<string, unknown> | undefined) {
    const results = await performGetCurrentNetwork();
    return {
        content: [{ type: "text" as const, text: results }],
        isError: false,
    };
}