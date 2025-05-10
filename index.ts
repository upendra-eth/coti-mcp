#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, ethers } from '@coti-io/coti-ethers';

const GET_COTI_BALANCE: Tool = {
    name: "coti_get_balance",
    description:
        "Get the balance of a COTI blockchain account." +
        "This is used for checking the current balance of a COTI account." +
        "Requires a COTI account address as input." +
        "Returns the account balance and additional account information.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., coti1abcdef1234567890abcdef1234567890abcdef",
            }
        },
        required: ["account_address"],
    },
};

const server = new Server(
    {
        name: "coti/blockchain-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    },
);

const COTI_MCP_AES_KEY = process.env.COTI_MCP_AES_KEY!;
if (!COTI_MCP_AES_KEY) {
    console.error("Error: COTI_MCP_AES_KEY environment variable is required");
    process.exit(1);
}

interface CotiBalance {
    address: string;
    balance: string;
    formattedBalance: string;
    currency: string;
}


function isGetCotiBalanceArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as { account_address: string }).account_address === "string"
    );
}

async function performGetCotiBalance(account_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Mainnet);
        
        const balanceWei = await provider.getBalance(account_address);
        
        const formattedBalance = ethers.formatUnits(balanceWei, 18);
        
        const balance: CotiBalance = {
            address: account_address,
            balance: balanceWei.toString(),
            formattedBalance: formattedBalance,
            currency: 'COTI',
        };

        return balance;
    } catch (error) {
        console.error('Error fetching COTI balance:', error);
        throw new Error(`Failed to get COTI balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [GET_COTI_BALANCE],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "coti_get_balance": {
                if (!isGetCotiBalanceArgs(args)) {
                    throw new Error("Invalid arguments for coti_get_balance");
                }
                const { account_address } = args;

                const results = await performGetCotiBalance(account_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            default:
                return {
                    content: [{ type: "text", text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }
    } catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("COTI Blockchain MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});