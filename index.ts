#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, Wallet, Contract, ethers } from '@coti-io/coti-ethers';

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
];

const GET_COTI_NATIVE_BALANCE: Tool = {
    name: "coti_get_native_balance",
    description:
        "Get the native COTI token balance of a COTI blockchain account." +
        "This is used for checking the current balance of a COTI account." +
        "Requires a COTI account address as input." +
        "Returns the account balance in COTI tokens.",
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

const GET_PRIVATE_ERC20_TOKEN_BALANCE: Tool = {
    name: "coti_get_private_erc20_token_balance",
    description:
        "Get the balance of a private ERC20 token on the COTI blockchain." +
        "This is used for checking the current balance of a private token for a COTI account." +
        "Requires a COTI account address and token contract address as input." +
        "Returns the decrypted token balance.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., coti1abcdef1234567890abcdef1234567890abcdef",
            },
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
        },
        required: ["account_address", "token_address"],
    },
};

const TRANSFER_NATIVE_COTI: Tool = {
    name: "coti_transfer_native",
    description:
        "Transfer native COTI tokens to another wallet." +
        "This is used for sending COTI tokens from your wallet to another address." +
        "Requires recipient address and amount in Wei as input." +
        "Returns the transaction hash upon successful transfer.",
    inputSchema: {
        type: "object",
        properties: {
            recipient_address: {
                type: "string",
                description: "Recipient COTI address, e.g., coti1abcdef1234567890abcdef1234567890abcdef",
            },
            amount_wei: {
                type: "string",
                description: "Amount of COTI to transfer (in Wei)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the transaction",
            },
        },
        required: ["recipient_address", "amount_wei"],
    },
};

const TRANSFER_PRIVATE_ERC20_TOKEN: Tool = {
    name: "coti_transfer_private_erc20_token",
    description:
        "Transfer private ERC20 tokens on the COTI blockchain." +
        "This is used for sending private tokens from your wallet to another address." +
        "Requires token contract address, recipient address, and amount as input." +
        "Returns the transaction hash upon successful transfer.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
            recipient_address: {
                type: "string",
                description: "Recipient COTI address, e.g., coti1abcdef1234567890abcdef1234567890abcdef",
            },
            amount_wei: {
                type: "string",
                description: "Amount of tokens to transfer (in Wei)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the transaction",
            },
        },
        required: ["token_address", "recipient_address", "amount_wei"],
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

const COTI_MCP_PRIVATE_KEY = process.env.COTI_MCP_PRIVATE_KEY!;
if (!COTI_MCP_PRIVATE_KEY) {
    console.error("Error: COTI_MCP_PRIVATE_KEY environment variable is required");
    process.exit(1);
}

function isGetCotiBalanceArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as { account_address: string }).account_address === "string"
    );
}

function isGetPrivateERC20TokenBalanceArgs(args: unknown): args is { account_address: string, token_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as { account_address: string }).account_address === "string" &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string"
    );
}

function isTransferNativeCotiArgs(args: unknown): args is { recipient_address: string, amount_wei: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "recipient_address" in args &&
        typeof (args as { recipient_address: string }).recipient_address === "string" &&
        "amount_wei" in args &&
        typeof (args as { amount_wei: string }).amount_wei === "string" &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}

function isTransferPrivateERC20TokenArgs(args: unknown): args is { token_address: string, recipient_address: string, amount_wei: string, gas_limit?: string } {
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

async function performGetCotiBalance(account_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        
        const balanceWei = await provider.getBalance(account_address);
        const formattedBalance = ethers.formatUnits(balanceWei, 18);
        
        return `Balance: ${formattedBalance} COTI`;

    } catch (error) {
        console.error('Error fetching COTI balance:', error);
        throw new Error(`Failed to get COTI balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performGetPrivateERC20TokenBalance(account_address: string, token_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);

        wallet.setAesKey(COTI_MCP_AES_KEY)
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const [decimalsResult, symbolResult] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol()
        ]);
        
        const encryptedBalance = await tokenContract.balanceOf(account_address);
        const decryptedBalance = await wallet.decryptValue(encryptedBalance);
        const formattedBalance = ethers.formatUnits(decryptedBalance, decimalsResult);
        
        return `Balance: ${formattedBalance} ${symbolResult}`;
    } catch (error) {
        console.error('Error fetching private token balance:', error);
        throw new Error(`Failed to get private token balance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performTransferNativeCoti(recipient_address: string, amount_wei: string, gas_limit?: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }
        
        const tx = await wallet.sendTransaction({
            to: recipient_address,
            value: amount_wei,
            ...txOptions
        });
        
        const receipt = await tx.wait();
        
        return `Transaction successful!\nToken: COTI\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nRecipient: ${recipient_address}`;
    } catch (error) {
        console.error('Error transferring COTI tokens:', error);
        throw new Error(`Failed to transfer COTI tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performTransferPrivateERC20Token(token_address: string, recipient_address: string, amount_wei: string, gas_limit?: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const symbolResult = await tokenContract.symbol();
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }

        const encryptedAmount = await wallet.encryptValue(amount_wei, token_address, "transfer");
        
        const tx = await tokenContract.transfer(recipient_address, encryptedAmount, txOptions);
        
        const receipt = await tx.wait();
        
        return `Private Token Transfer Successful!\nToken: ${symbolResult}\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nRecipient: ${recipient_address}`;
    } catch (error) {
        console.error('Error transferring private ERC20 tokens:', error);
        throw new Error(`Failed to transfer private ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [GET_COTI_NATIVE_BALANCE, GET_PRIVATE_ERC20_TOKEN_BALANCE, TRANSFER_NATIVE_COTI, TRANSFER_PRIVATE_ERC20_TOKEN],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "coti_get_native_balance": {
                if (!isGetCotiBalanceArgs(args)) {
                    throw new Error("Invalid arguments for coti_get_native_balance");
                }
                const { account_address } = args;

                const results = await performGetCotiBalance(account_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "coti_get_private_erc20_token_balance": {
                if (!isGetPrivateERC20TokenBalanceArgs(args)) {
                    throw new Error("Invalid arguments for coti_get_private_erc20_token_balance");
                }
                const { account_address, token_address } = args;

                const results = await performGetPrivateERC20TokenBalance(account_address, token_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "coti_transfer_native": {
                if (!isTransferNativeCotiArgs(args)) {
                    throw new Error("Invalid arguments for coti_transfer_native");
                }
                const { recipient_address, amount_wei, gas_limit } = args;

                const results = await performTransferNativeCoti(recipient_address, amount_wei, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "coti_transfer_private_erc20_token": {
                if (!isTransferPrivateERC20TokenArgs(args)) {
                    throw new Error("Invalid arguments for coti_transfer_private_erc20_token");
                }
                const { token_address, recipient_address, amount_wei, gas_limit } = args;

                const results = await performTransferPrivateERC20Token(token_address, recipient_address, amount_wei, gas_limit);
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