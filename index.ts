#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Native tools
import { GET_NATIVE_BALANCE, getNativeBalanceHandler } from './tools/native/getNativeBalance.js';
import { TRANSFER_NATIVE, transferNativeHandler } from './tools/native/transferNative.js';

// ERC20 tools
import { GET_PRIVATE_ERC20_TOKEN_BALANCE, getPrivateERC20BalanceHandler } from './tools/erc20/getPrivateErc20Balance.js';
import { GET_PRIVATE_ERC20_TOTAL_SUPPLY, getPrivateERC20TotalSupplyHandler } from "./tools/erc20/getPrivateErc20TotalSupply.js";
import { GET_PRIVATE_ERC20_DECIMALS, getPrivateERC20DecimalsHandler } from "./tools/erc20/getPrivateErc20Decimals.js";
import { TRANSFER_PRIVATE_ERC20_TOKEN, transferPrivateERC20TokenHandler } from "./tools/erc20/transferPrivateErc20.js";
import { DEPLOY_PRIVATE_ERC20_CONTRACT, deployPrivateERC20ContractHandler } from "./tools/erc20/deployPrivateErc20Contract.js";
import { MINT_PRIVATE_ERC20_TOKEN, mintPrivateERC20TokenHandler } from "./tools/erc20/mintPrivateErc20Token.js";
import { APPROVE_ERC20_SPENDER, approveERC20SpenderHandler } from "./tools/erc20/approveErc20Spender.js";
import { GET_ERC20_ALLOWANCE, getERC20AllowanceHandler } from "./tools/erc20/getErc20Allowance.js";

// ERC721 tools
import { TRANSFER_PRIVATE_ERC721_TOKEN, transferPrivateERC721TokenHandler } from "./tools/erc721/transferPrivateErc721.js";
import { GET_PRIVATE_ERC721_TOKEN_URI, getPrivateERC721TokenURIHandler } from "./tools/erc721/getPrivateErc721TokenUri.js";
import { GET_PRIVATE_ERC721_TOKEN_OWNER, getPrivateERC721TokenOwnerHandler } from "./tools/erc721/getPrivateErc721TokenOwner.js";
import { GET_PRIVATE_ERC721_TOTAL_SUPPLY, getPrivateERC721TotalSupplyHandler } from "./tools/erc721/getPrivateErc721TotalSupply.js";
import { DEPLOY_PRIVATE_ERC721_CONTRACT, deployPrivateERC721ContractHandler } from "./tools/erc721/deployPrivateErc721Contract.js";
import { MINT_PRIVATE_ERC721_TOKEN, mintPrivateERC721TokenHandler } from "./tools/erc721/mintPrivateErc721Token.js";

// Account tools
import { CHANGE_DEFAULT_ACCOUNT, changeDefaultAccountHandler } from './tools/account/changeDefaultAccount.js';
import { CREATE_ACCOUNT, createAccountHandler } from './tools/account/createAccount.js';
import { GENERATE_AES_KEY, generateAesKeyHandler } from './tools/account/generateAesKey.js';
import { LIST_ACCOUNTS, listAccountsHandler } from './tools/account/listAccounts.js';
import { EXPORT_ACCOUNTS, exportAccountsHandler } from './tools/account/exportAccounts.js';
import { IMPORT_ACCOUNTS, importAccountsHandler } from './tools/account/importAccounts.js';

// Encryption tools
import { ENCRYPT_VALUE, encryptValueHandler } from "./tools/account/encryptValue.js";
import { DECRYPT_VALUE, decryptValueHandler } from "./tools/account/decryptValue.js";

// Transaction tools
import { GET_TRANSACTION_STATUS, getTransactionStatusHandler } from "./tools/transaction/getTransactionStatus.js";
import { GET_TRANSACTION_LOGS, getTransactionLogsHandler } from "./tools/transaction/getTransactionLogs.js";
import { DECODE_EVENT_DATA, decodeEventDataHandler } from "./tools/transaction/decodeEventData.js";
import { CALL_CONTRACT_FUNCTION, callContractFunctionHandler } from "./tools/transaction/callContractFunction.js";

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

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        // Account tools
        CHANGE_DEFAULT_ACCOUNT,
        CREATE_ACCOUNT,
        DECRYPT_VALUE,
        ENCRYPT_VALUE, 
        EXPORT_ACCOUNTS,
        GENERATE_AES_KEY,
        IMPORT_ACCOUNTS,
        LIST_ACCOUNTS,

        // ERC20 Tools
        APPROVE_ERC20_SPENDER,
        DEPLOY_PRIVATE_ERC20_CONTRACT,
        GET_ERC20_ALLOWANCE,
        GET_PRIVATE_ERC20_TOKEN_BALANCE, 
        GET_PRIVATE_ERC20_DECIMALS,
        GET_PRIVATE_ERC20_TOTAL_SUPPLY,
        MINT_PRIVATE_ERC20_TOKEN,
        TRANSFER_PRIVATE_ERC20_TOKEN, 
        
        // ERC721 Tools
        DEPLOY_PRIVATE_ERC721_CONTRACT,
        GET_PRIVATE_ERC721_TOKEN_OWNER,
        GET_PRIVATE_ERC721_TOKEN_URI,
        GET_PRIVATE_ERC721_TOTAL_SUPPLY,
        MINT_PRIVATE_ERC721_TOKEN,
        TRANSFER_PRIVATE_ERC721_TOKEN,
        
        // Native tools
        GET_NATIVE_BALANCE, 
        TRANSFER_NATIVE,

        // Transaction tools
        CALL_CONTRACT_FUNCTION,
        DECODE_EVENT_DATA,
        GET_TRANSACTION_LOGS,
        GET_TRANSACTION_STATUS,
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        switch (name) {
            case "get_native_balance": {
                return await getNativeBalanceHandler(args);
            }
            
            case "get_private_erc20_balance": {
                return await getPrivateERC20BalanceHandler(args);
            }
            
            case "transfer_native": {
                return await transferNativeHandler(args);
            }
            
            case "transfer_private_erc20": {
                return await transferPrivateERC20TokenHandler(args);
            }
            
            case "encrypt_value": {
                return await encryptValueHandler(args);
            }

            case "decrypt_value": {
                return await decryptValueHandler(args);
            }
            
            case "transfer_private_erc721": {
                return await transferPrivateERC721TokenHandler(args);
            }
            
            case "get_private_erc721_token_uri": {
                return await getPrivateERC721TokenURIHandler(args);
            }
            
            case "get_private_erc721_token_owner": {
                return await getPrivateERC721TokenOwnerHandler(args);
            }
            
            case "get_private_erc721_total_supply": {
                return await getPrivateERC721TotalSupplyHandler(args);
            }

            case "get_private_erc20_total_supply": {
                return await getPrivateERC20TotalSupplyHandler(args);
            }
            
            case "get_private_erc20_decimals": {
                return await getPrivateERC20DecimalsHandler(args);
            }
            
            case "deploy_private_erc721_contract": {
                return await deployPrivateERC721ContractHandler(args);
            }

            case "deploy_private_erc20_contract": {
                return await deployPrivateERC20ContractHandler(args);
            }
            
            case "mint_private_erc721_token": {
                return await mintPrivateERC721TokenHandler(args);
            }
            
            case "mint_private_erc20_token": {
                return await mintPrivateERC20TokenHandler(args);
            }
            
            case "approve_erc20_spender": {
                return await approveERC20SpenderHandler(args);
            }
            
            case "get_erc20_allowance": {
                return await getERC20AllowanceHandler(args);
            }

            case "change_default_account": {
                return await changeDefaultAccountHandler(args);
            }

            case "create_account": {
                return await createAccountHandler(args);
            }

            case "generate_aes_key": {
                return await generateAesKeyHandler(args);
            }
            
            case "list_accounts": {
                return await listAccountsHandler(args);
            }
            
            case "export_accounts": {
                return await exportAccountsHandler(args);
            }
            
            case "import_accounts": {
                return await importAccountsHandler(args);
            }

            case "get_transaction_status": {
                return await getTransactionStatusHandler(args);
            }
            
            case "get_transaction_logs": {
                return await getTransactionLogsHandler(args);
            }
            
            case "decode_event_data": {
                return await decodeEventDataHandler(args);
            }
            
            case "call_contract_function": {
                return await callContractFunctionHandler(args);
            }

            case "approve_erc20_spender": {
                return await approveERC20SpenderHandler(args);
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