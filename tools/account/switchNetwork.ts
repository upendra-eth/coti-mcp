import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export const SWITCH_NETWORK: ToolAnnotations = {
    title: "Switch Network",
    name: "switch_network",
    description: "Switch between COTI testnet and mainnet networks. This changes the network for all subsequent blockchain operations. Valid networks are 'testnet' and 'mainnet'. Returns confirmation of the network switch.",
    inputSchema: {
        network: z.enum(['testnet', 'mainnet']).describe("Network to switch to - either 'testnet' or 'mainnet'"),
    }
};

/**
 * Validates the arguments for switching networks
 * @param args The arguments to validate
 * @returns True if the arguments are valid, false otherwise
 */
export function isSwitchNetworkArgs(args: unknown): args is { network: 'testnet' | 'mainnet' } {
    return (
        typeof args === "object" &&
        args !== null &&
        "network" in args &&
        typeof (args as { network: string }).network === "string" &&
        ['testnet', 'mainnet'].includes((args as { network: string }).network)
    );
}

/**
 * Switches the COTI network for blockchain operations.
 * @param network The network to switch to ('testnet' or 'mainnet')
 * @returns A formatted string confirming the network switch
 */
export async function performSwitchNetwork(network: 'testnet' | 'mainnet') {
    try {
        const previousNetwork = process.env.COTI_MCP_NETWORK?.toLowerCase() || 'testnet';
        
        process.env.COTI_MCP_NETWORK = network;
        
        if (previousNetwork === network) {
            return `Network is already set to: ${network}`;
        }
        
        return `Network successfully switched from ${previousNetwork} to: ${network}`;
    } catch (error) {
        console.error('Error switching network:', error);
        throw new Error(`Failed to switch network: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the switchNetwork tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function switchNetworkHandler(args: Record<string, unknown> | undefined) {
    if (!isSwitchNetworkArgs(args)) {
        throw new Error("Invalid arguments for switch_network. Expected 'network' to be either 'testnet' or 'mainnet'");
    }
    const { network } = args;

    const results = await performSwitchNetwork(network);
    return {
        content: [{ type: "text" as const, text: results }],
        isError: false,
    };
}