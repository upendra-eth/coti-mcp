#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, Wallet, Contract, ethers } from '@coti-io/coti-ethers';
import { buildStringInputText } from '@coti-io/coti-sdk-typescript';
import { getCurrentAccountKeys } from "./tools/shared/account.js";
import { ERC721_ABI } from "./tools/constants/abis.js";

// Native tools
import { GET_NATIVE_BALANCE, performGetNativeBalance, isGetNativeBalanceArgs } from './tools/getNativeBalance.js';
import { TRANSFER_NATIVE, performTransferNative, isTransferNativeArgs } from './tools/transferNative.js';

// ERC20 tools
import { GET_PRIVATE_ERC20_TOKEN_BALANCE, isGetPrivateERC20TokenBalanceArgs, performGetPrivateERC20TokenBalance } from './tools/getPrivateErc20Balance.js';
import { GET_PRIVATE_ERC20_TOTAL_SUPPLY, isGetPrivateERC20TotalSupplyArgs, performGetPrivateERC20TotalSupply } from "./tools/getPrivateErc20TotalSupply.js";
import { GET_PRIVATE_ERC20_DECIMALS, isGetPrivateERC20DecimalsArgs, performGetPrivateERC20Decimals } from "./tools/getPrivateErc20Decimals.js";
import { TRANSFER_PRIVATE_ERC20_TOKEN, isTransferPrivateERC20TokenArgs, performTransferPrivateERC20Token } from "./tools/transferPrivateErc20.js";
import { DEPLOY_PRIVATE_ERC20_CONTRACT, isDeployPrivateERC20ContractArgs, performDeployPrivateERC20Contract } from "./tools/deployPrivateErc20Contract.js";
import { MINT_PRIVATE_ERC20_TOKEN, isMintPrivateERC20TokenArgs, performMintPrivateERC20Token } from "./tools/mintPrivateErc20Token.js";

// ERC721 tools
import { TRANSFER_PRIVATE_ERC721_TOKEN, isTransferPrivateERC721TokenArgs, performTransferPrivateERC721Token } from "./tools/transferPrivateErc721.js";
import { GET_PRIVATE_ERC721_TOKEN_URI, isGetPrivateERC721TokenURIArgs, performGetPrivateERC721TokenURI } from "./tools/getPrivateErc721TokenUri.js";
import { GET_PRIVATE_ERC721_TOKEN_OWNER, isGetPrivateERC721TokenOwnerArgs, performGetPrivateERC721TokenOwner } from "./tools/getPrivateErc721TokenOwner.js";
import { GET_PRIVATE_ERC721_TOTAL_SUPPLY, isGetPrivateERC721TotalSupplyArgs, performGetPrivateERC721TotalSupply } from "./tools/getPrivateErc721TotalSupply.js";
import { DEPLOY_PRIVATE_ERC721_CONTRACT, isDeployPrivateERC721ContractArgs, performDeployPrivateERC721Contract } from "./tools/deployPrivateErc721Contract.js";

// Account tools
import { CREATE_ACCOUNT, isCreateAccountArgs, performCreateAccount } from "./tools/createAccount.js";
import { LIST_ACCOUNTS, performListAccounts } from "./tools/listAccounts.js";
import { CHANGE_DEFAULT_ACCOUNT, isChangeDefaultAccountArgs, performChangeDefaultAccount } from "./tools/changeDefaultAccount.js";
import { GENERATE_AES_KEY, isGenerateAesKeyArgs, performGenerateAesKey } from "./tools/generateAesKey.js";

// Encryption tools
import { ENCRYPT_VALUE, isEncryptValueArgs, performEncryptValue } from "./tools/encryptValue.js";
import { DECRYPT_VALUE, isDecryptValueArgs, performDecryptValue } from "./tools/decryptValue.js";
import { CALL_CONTRACT_FUNCTION, isCallContractFunctionArgs, performCallContractFunction } from "./tools/callContractFunction.js";
import { DECODE_EVENT_DATA, isDecodeEventDataArgs, performDecodeEventData } from "./tools/decodeEventData.js";

// Transaction tools
import { GET_TRANSACTION_STATUS, isGetTransactionStatusArgs, performGetTransactionStatus } from "./tools/getTransactionStatus.js";
import { GET_TRANSACTION_LOGS, isGetTransactionLogsArgs, performGetTransactionLogs } from "./tools/getTransactionLogs.js";

const MINT_PRIVATE_ERC721_TOKEN: Tool = {
    name: "mint_private_erc721_token",
    description:
        "Mint a new private ERC721 NFT token on the COTI blockchain. " +
        "This creates a new NFT in the specified collection with the provided token URI. " +
        "Returns the transaction hash and token ID upon successful minting.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            to_address: {
                type: "string",
                description: "Address to receive the minted NFT",
            },
            token_uri: {
                type: "string",
                description: "URI for the token metadata (can be IPFS URI or any other URI)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the minting transaction",
            },
        },
        required: ["token_address", "to_address", "token_uri"],
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
    }
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

const COTI_MCP_PUBLIC_KEY = process.env.COTI_MCP_PUBLIC_KEY!;
if (!COTI_MCP_PUBLIC_KEY) {
    console.error("Error: COTI_MCP_PUBLIC_KEY environment variable is required");
    process.exit(1);
}

function isMintPrivateERC721TokenArgs(args: unknown): args is { token_address: string, to_address: string, token_uri: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "to_address" in args &&
        typeof (args as { to_address: string }).to_address === "string" &&
        "token_uri" in args &&
        typeof (args as { token_uri: string }).token_uri === "string" &&
        (!("gas_limit" in args) || ("gas_limit" in args && typeof (args as { gas_limit: string }).gas_limit === "string"))
    );
}

async function performMintPrivateERC721Token(token_address: string, to_address: string, token_uri: string, gas_limit?: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const mintSelector = tokenContract.mint.fragment.selector;
        
        const encryptedInputText = buildStringInputText(token_uri, { wallet: wallet, userKey: currentAccountKeys.aesKey }, token_address, mintSelector);
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }
        
        const mintTx = await tokenContract.mint(to_address, encryptedInputText, txOptions);
        const receipt = await mintTx.wait();
        
        let tokenId = "Unknown";
        if (receipt && receipt.logs && receipt.logs.length > 0) {
            const transferEvent = receipt.logs[0];
            if (transferEvent && transferEvent.topics && transferEvent.topics.length > 3) {
                tokenId = BigInt(transferEvent.topics[3]).toString();
            }
        }
        
        return `NFT Minting Successful!\nTo Address: ${to_address}\nToken Address: ${token_address}\nToken URI: ${token_uri}\nToken ID: ${tokenId}\nTransaction Hash: ${receipt.hash}`;
    } catch (error) {
        console.error('Error minting private ERC721 token:', error);
        throw new Error(`Failed to mint private ERC721 token: ${error instanceof Error ? error.message : String(error)}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        GET_NATIVE_BALANCE, 
        TRANSFER_NATIVE, 
        GET_PRIVATE_ERC20_TOKEN_BALANCE, 
        TRANSFER_PRIVATE_ERC20_TOKEN, 
        TRANSFER_PRIVATE_ERC721_TOKEN,
        GET_PRIVATE_ERC721_TOKEN_URI,
        GET_PRIVATE_ERC721_TOKEN_OWNER,
        GET_PRIVATE_ERC721_TOTAL_SUPPLY,
        GET_PRIVATE_ERC20_TOTAL_SUPPLY,
        GET_PRIVATE_ERC20_DECIMALS,
        DEPLOY_PRIVATE_ERC721_CONTRACT,
        DEPLOY_PRIVATE_ERC20_CONTRACT,
        MINT_PRIVATE_ERC721_TOKEN,
        MINT_PRIVATE_ERC20_TOKEN,
        ENCRYPT_VALUE, 
        DECRYPT_VALUE,
        CHANGE_DEFAULT_ACCOUNT,
        CREATE_ACCOUNT,
        GENERATE_AES_KEY,
        GET_TRANSACTION_STATUS,
        GET_TRANSACTION_LOGS,
        DECODE_EVENT_DATA,
        CALL_CONTRACT_FUNCTION,
        LIST_ACCOUNTS
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case "get_native_balance": {
                if (!isGetNativeBalanceArgs(args)) {
                    throw new Error("Invalid arguments for get_native_balance");
                }
                const { account_address } = args;

                const results = await performGetNativeBalance(account_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "get_private_erc20_balance": {
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
            
            case "transfer_native": {
                if (!isTransferNativeArgs(args)) {
                    throw new Error("Invalid arguments for transfer_native");
                }
                const { recipient_address, amount_wei, gas_limit } = args;

                const results = await performTransferNative(recipient_address, amount_wei, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "transfer_private_erc20": {
                if (!isTransferPrivateERC20TokenArgs(args)) {
                    throw new Error("Invalid arguments for transfer_private_erc20");
                }
                const { token_address, recipient_address, amount_wei, gas_limit } = args;

                const results = await performTransferPrivateERC20Token(token_address, recipient_address, amount_wei, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "encrypt_value": {
                if (!isEncryptValueArgs(args)) {
                    throw new Error("Invalid arguments for encrypt_value");
                }
                const { message, contract_address, function_selector } = args;

                const results = await performEncryptValue(message, contract_address, function_selector);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "decrypt_value": {
                if (!isDecryptValueArgs(args)) {
                    throw new Error("Invalid arguments for decrypt_value");
                }
                const { ciphertext } = args;

                const results = await performDecryptValue(BigInt(ciphertext));
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "transfer_private_erc721": {
                if (!isTransferPrivateERC721TokenArgs(args)) {
                    throw new Error("Invalid arguments for transfer_private_erc721");
                }
                const { token_address, recipient_address, token_id, use_safe_transfer, gas_limit } = args;

                const results = await performTransferPrivateERC721Token(
                    token_address, 
                    recipient_address, 
                    token_id, 
                    use_safe_transfer || false, 
                    gas_limit
                );
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "get_private_erc721_token_uri": {
                if (!isGetPrivateERC721TokenURIArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc721_token_uri");
                }
                const { token_address, token_id } = args;

                const results = await performGetPrivateERC721TokenURI(token_address, token_id);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "get_private_erc721_token_owner": {
                if (!isGetPrivateERC721TokenOwnerArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc721_token_owner");
                }
                const { token_address, token_id } = args;

                const results = await performGetPrivateERC721TokenOwner(token_address, token_id);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "get_private_erc721_total_supply": {
                if (!isGetPrivateERC721TotalSupplyArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc721_total_supply");
                }
                const { token_address } = args;

                const results = await performGetPrivateERC721TotalSupply(token_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "get_private_erc20_total_supply": {
                if (!isGetPrivateERC20TotalSupplyArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc20_total_supply");
                }
                const { token_address } = args;

                const results = await performGetPrivateERC20TotalSupply(token_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "get_private_erc20_decimals": {
                if (!isGetPrivateERC20DecimalsArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc20_decimals");
                }
                const { token_address } = args;

                const results = await performGetPrivateERC20Decimals(token_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "deploy_private_erc721_contract": {
                if (!isDeployPrivateERC721ContractArgs(args)) {
                    throw new Error("Invalid arguments for deploy_private_erc721_contract");
                }
                const { name, symbol, gas_limit } = args;

                const results = await performDeployPrivateERC721Contract(name, symbol, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "deploy_private_erc20_contract": {
                if (!isDeployPrivateERC20ContractArgs(args)) {
                    throw new Error("Invalid arguments for deploy_private_erc20_contract");
                }
                const { name, symbol } = args;

                const results = await performDeployPrivateERC20Contract(name, symbol);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "mint_private_erc721_token": {
                if (!isMintPrivateERC721TokenArgs(args)) {
                    throw new Error("Invalid arguments for mint_private_erc721_token");
                }
                const { token_address, to_address, token_uri, gas_limit } = args;

                const results = await performMintPrivateERC721Token(token_address, to_address, token_uri, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "mint_private_erc20_token": {
                if (!isMintPrivateERC20TokenArgs(args)) {
                    throw new Error("Invalid arguments for mint_private_erc20_token");
                }
                const { token_address, recipient_address, amount_wei, gas_limit } = args;

                const results = await performMintPrivateERC20Token(token_address, recipient_address, amount_wei, gas_limit);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "change_default_account": {
                if (!isChangeDefaultAccountArgs(args)) {
                    throw new Error("Invalid arguments for change_default_account");
                }
                const { account_address } = args;

                const results = await performChangeDefaultAccount(account_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "create_account": {
                if (!isCreateAccountArgs(args)) {
                    throw new Error("Invalid arguments for create_account");
                }
                const { set_as_default } = args;

                const results = await performCreateAccount(set_as_default || false);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "generate_aes_key": {
                if (!isGenerateAesKeyArgs(args)) {
                    throw new Error("Invalid arguments for generate_aes_key");
                }
                const { account_address } = args;

                const results = await performGenerateAesKey(account_address);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "list_accounts": {
                const results = await performListAccounts();
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }

            case "get_transaction_status": {
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
            
            case "get_transaction_logs": {
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
            
            case "decode_event_data": {
                if (!isDecodeEventDataArgs(args)) {
                    throw new Error("Invalid arguments for decode_event_data");
                }
                const { topics, data, abi } = args;

                const results = await performDecodeEventData(topics, data, abi);
                return {
                    content: [{ type: "text", text: results }],
                    isError: false,
                };
            }
            
            case "call_contract_function": {
                if (!isCallContractFunctionArgs(args)) {
                    throw new Error("Invalid arguments for call_contract_function");
                }
                const { contract_address, function_name, function_args, abi } = args;

                const results = await performCallContractFunction(contract_address, function_name, function_args, abi);
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