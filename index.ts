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
import { getAccountKeys, getCurrentAccountKeys } from "./tools/shared/account.js";
import { ERC20_ABI, ERC721_ABI } from "./tools/constants/abis.js";

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

// Account tools
import { CREATE_ACCOUNT, isCreateAccountArgs, performCreateAccount } from "./tools/createAccount.js";
import { LIST_ACCOUNTS, performListAccounts } from "./tools/listAccounts.js";

const TRANSFER_PRIVATE_ERC721_TOKEN: Tool = {
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

const GET_PRIVATE_ERC721_TOKEN_URI: Tool = {
    name: "get_private_erc721_token_uri",
    description:
        "Get the tokenURI for a private ERC721 NFT token on the COTI blockchain. " +
        "This is used for retrieving the metadata URI of a private NFT. " +
        "Requires token contract address and token ID as input. " +
        "Returns the decrypted tokenURI.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            token_id: {
                type: "string",
                description: "ID of the NFT token to get the URI for",
            },
        },
        required: ["token_address", "token_id"],
    },
};

const GET_PRIVATE_ERC721_TOKEN_OWNER: Tool = {
    name: "get_private_erc721_token_owner",
    description:
        "Get the owner address of a private ERC721 NFT token on the COTI blockchain. " +
        "This is used for checking who currently owns a specific NFT. " +
        "Requires token contract address and token ID as input. " +
        "Returns the owner's address of the specified NFT.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
            token_id: {
                type: "string",
                description: "ID of the NFT token to check ownership for",
            },
        },
        required: ["token_address", "token_id"],
    },
};

const GET_PRIVATE_ERC721_TOTAL_SUPPLY: Tool = {
    name: "get_private_erc721_total_supply",
    description:
        "Get the total supply of tokens for a private ERC721 NFT collection on the COTI blockchain. " +
        "This is used for checking how many NFTs have been minted in a collection. " +
        "Requires token contract address as input. " +
        "Returns the total number of tokens in the collection.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC721 token contract address on COTI blockchain",
            },
        },
        required: ["token_address"],
    },
};

const DEPLOY_PRIVATE_ERC721_CONTRACT: Tool = {
    name: "deploy_private_erc721_contract",
    description:
        "Deploy a new standard private ERC721 NFT contract on the COTI blockchain. " +
        "This creates a new private NFT collection with the specified name and symbol. " +
        "Returns the deployed contract address upon successful deployment.",
    inputSchema: {
        type: "object",
        properties: {
            name: {
                type: "string",
                description: "Name of the NFT collection",
            },
            symbol: {
                type: "string",
                description: "Symbol of the NFT collection (typically 3-5 characters)",
            },
            gas_limit: {
                type: "string",
                description: "Optional gas limit for the deployment transaction",
            },
        },
        required: ["name", "symbol"],
    },
};

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

const ENCRYPT_VALUE: Tool = {
    name: "encrypt_value",
    description:
        "Encrypt a value using the COTI AES key. " +
        "This is used for encrypting values to be sent to another address. " +
        "Requires a value, contract address, and function selector as input. " +
        "Returns the signature.",
    inputSchema: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Message to encrypt",
            },
            contract_address: {
                type: "string",
                description: "Contract address",
            },
            function_selector: {
                type: "string",
                description: "Function selector. To get the function selector, use the keccak256 hash of the function signature. For instance, for the transfer function of an ERC20 token, the function selector is '0xa9059cbb'.",
            },
        },
        required: ["message", "contract_address", "function_selector"],
    },
};

const DECRYPT_VALUE: Tool = {
    name: "decrypt_value",
    description:
        "Decrypt a value using the COTI AES key. " +
        "Requires a ciphertext as input. " +
        "Returns the decrypted value.",
    inputSchema: {
        type: "object",
        properties: {
            ciphertext: {
                type: "string",
                description: "Ciphertext to decrypt",
            },
        },
        required: ["ciphertext"],
    },
};

const CHANGE_DEFAULT_ACCOUNT: Tool = {
    name: "change_default_account",
    description: "Change the default account used for COTI blockchain operations. This allows switching between different accounts configured in the environment. The account must be configured in the environment variables with corresponding private and AES keys. Returns the new default account address upon successful change.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address to set as default, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273"
            }
        },
        required: ["account_address"]
    }
};

const GENERATE_AES_KEY: Tool = {
    name: "generate_aes_key",
    description: "Generate a new AES key for the current account. Returns the AES key.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "The address of the account to generate the AES key for."
            }
        }
    }
};

const GET_TRANSACTION_STATUS: Tool = {
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

const GET_TRANSACTION_LOGS: Tool = {
    name: "get_transaction_logs",
    description:
        "Get the logs from a transaction on the COTI blockchain. " +
        "This is used for retrieving event logs emitted during transaction execution. " +
        "Requires a transaction hash as input. " +
        "Returns detailed information about the transaction logs including event names, topics, and data.",
    inputSchema: {
        type: "object",
        properties: {
            transaction_hash: {
                type: "string",
                description: "Transaction hash to get logs for",
            }
        },
        required: ["transaction_hash"],
    },
};

const DECODE_EVENT_DATA: Tool = {
    name: "decode_event_data",
    description: "Decode event data from a transaction log based on the event signature. This helps interpret the raw data in transaction logs by matching the event signature to known event types and decoding the parameters. Requires event signature, topics, and data from a transaction log.",
    inputSchema: {
        type: "object",
        properties: {
            topics: {
                type: "array",
                items: {
                    type: "string"
                },
                description: "Array of topics from the transaction log",
            },
            data: {
                type: "string",
                description: "Data field from the transaction log",
            },
            abi: {
                type: "string",
                description: "Optional JSON string representation of the contract ABI. If not provided, will attempt to use standard ERC20/ERC721 ABIs.",
            },
        },
        required: ["topics", "data"],
    },
};

const CALL_CONTRACT_FUNCTION: Tool = {
    name: "call_contract_function",
    description:
        "Call a read-only function on any smart contract on the COTI blockchain. " +
        "This allows retrieving data from any contract by specifying the contract address, function name, and parameters. " +
        "Returns the function result in a human-readable format.",
    inputSchema: {
        type: "object",
        properties: {
            contract_address: {
                type: "string",
                description: "Address of the smart contract to call",
            },
            function_name: {
                type: "string",
                description: "Name of the function to call on the contract",
            },
            function_args: {
                type: "array",
                description: "Array of arguments to pass to the function (can be empty if function takes no arguments)",
                items: {
                    type: "string"
                }
            },
            abi: {
                type: "string",
                description: "Optional JSON string representation of the contract ABI. If not provided, will attempt to use standard ERC20/ERC721 ABIs.",
            },
        },
        required: ["contract_address", "function_name", "function_args"],
    },
};

/**
 * Generates a new AES key for the current account.
 * @param account_address The address of the account to generate the AES key for.
 * @returns The generated AES key.
 */
async function performGenerateAesKey(account_address: string): Promise<string> {
    try {
        const currentAccountKeys = getAccountKeys(account_address);
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);

        await wallet.generateOrRecoverAes();

        const aesKey = wallet.getUserOnboardInfo()?.aesKey;

        if (aesKey !== null && typeof aesKey !== 'string') {
            throw new Error('AES key is not a string');
        }

        if (!aesKey) {
            throw new Error('Failed to generate AES key');
        }

        // set the aes key for the account
        const publicKeys = (process.env.COTI_MCP_PUBLIC_KEY || '').split(',').filter(Boolean);
        const privateKeys = (process.env.COTI_MCP_PRIVATE_KEY || '').split(',').filter(Boolean);
        const aesKeys = (process.env.COTI_MCP_AES_KEY || '').split(',').filter(Boolean);

        const addressIndex = publicKeys.findIndex(key => key.toLowerCase() === account_address.toLowerCase());

        if (addressIndex === -1 || !privateKeys[addressIndex] || !aesKeys[addressIndex]) {
            throw new Error(`No keys found for account: ${account_address}`);
        }

        aesKeys[addressIndex] = aesKey;

        process.env.COTI_MCP_AES_KEY = aesKeys.join(',');

        return "AES key: " + aesKey + "\n\n" +
               "Address: " + wallet.address;
    } catch (error) {
        console.error('Error generating AES key:', error);
        throw new Error(`Failed to generate AES key: ${error instanceof Error ? error.message : String(error)}`);
    }
}



async function performGetTransactionStatus(transaction_hash: string): Promise<string> {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
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

async function performDecodeEventData(topics: string[], data: string, abi?: string): Promise<string> {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const currentAccountKeys = getCurrentAccountKeys();
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        const standardAbis = [...ERC20_ABI, ...ERC721_ABI];
        
        const iface = new ethers.Interface(abi || standardAbis);
        const decodedData = iface.parseLog({
            topics: topics,
            data: data
        });
        
        let result = "Event Decoding Results:\n\n";
        result += "Decoded Data:\n\n";
        
        if (!decodedData) {
            return "No decoded data found.";
        }

        result += `Event Name: ${decodedData.name}\n\n`;
        result += `Event Signature: ${decodedData.signature}\n\n`;
        result += `Event Topic: ${decodedData.topic}\n\n`;

        for (let index = 0; index < decodedData.fragment.inputs.length; index++) {
            const input = decodedData.fragment.inputs[index];
            const value = decodedData.args[index];
        
            result += `Input ${index}, Name: ${input.name}, Type: ${input.type}, Value: ${value}\n\n`;
        
            try {
                const decryptedValue = await wallet.decryptValue(value);
                result += `Decrypted Value: ${decryptedValue}\n\n`;
            } catch (error) {
                result += `Decrypted Value: [decryption failed or not applicable]\n\n`;
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error decoding event data:', error);
        throw new Error(`Failed to decode event data: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performGetTransactionLogs(transaction_hash: string): Promise<string> {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
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

async function performCallContractFunction(contract_address: string, function_name: string, function_args: string[], abi?: string): Promise<string> {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        let contractAbi;
        if (abi) {
            try {
                contractAbi = JSON.parse(abi);
            } catch (e) {
                throw new Error(`Invalid ABI format: ${e instanceof Error ? e.message : String(e)}`);
            }
        } else {
            try {
                const tempContract = new Contract(contract_address, ERC20_ABI, wallet);
                await tempContract.decimals();
                contractAbi = ERC20_ABI;
            } catch (e) {
                try {
                    const tempContract = new Contract(contract_address, ERC721_ABI, wallet);
                    await tempContract.ownerOf(1);
                    contractAbi = ERC721_ABI;
                } catch (e2) {
                    throw new Error('Could not determine contract type. Please provide the ABI.');
                }
            }
        }
        
        const contract = new Contract(contract_address, contractAbi, wallet);
        
        if (!contract[function_name]) {
            throw new Error(`Function '${function_name}' not found in contract. Check the function name or provide a custom ABI.`);
        }
        
        const processedArgs = function_args.map(arg => {
            if (arg.toLowerCase() === 'true') return true;
            if (arg.toLowerCase() === 'false') return false;
            if (arg.match(/^0x[0-9a-fA-F]{40}$/)) return arg;
            if (arg.match(/^-?\d+$/)) return BigInt(arg);
            if (arg.match(/^-?\d+\.\d+$/)) return parseFloat(arg);
            return arg;
        });
        
        const result = await contract[function_name](...processedArgs);
        
        let formattedResult: string;
        if (typeof result === 'object' && result !== null) {
            const replacer = (key: string, value: any) => {
                if (typeof value === 'bigint') {
                    return value.toString();
                }
                return value;
            };
            
            if (Array.isArray(result)) {
                formattedResult = JSON.stringify(result, replacer, 2);
            } else if (result._isBigNumber || typeof result.toString === 'function') {
                formattedResult = result.toString();
            } else {
                formattedResult = JSON.stringify(result, replacer, 2);
            }
        } else if (typeof result === 'bigint') {
            formattedResult = result.toString();
        } else {
            formattedResult = String(result);
        }
        
        return `Function Call Successful!\n\nContract: ${contract_address}\n\nFunction: ${function_name}\n\nArguments: ${JSON.stringify(processedArgs)}\n\nResult: ${formattedResult}`;
    } catch (error) {
        console.error('Error calling contract function:', error);
        throw new Error(`Failed to call contract function: ${error instanceof Error ? error.message : String(error)}`);
    }
}

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

function isTransferPrivateERC721TokenArgs(args: unknown): args is { token_address: string, recipient_address: string, token_id: string, use_safe_transfer?: boolean, gas_limit?: string } {
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

function isGetPrivateERC721TokenURIArgs(args: unknown): args is { token_address: string, token_id: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "token_id" in args &&
        typeof (args as { token_id: string }).token_id === "string"
    );
}

function isGetPrivateERC721TokenOwnerArgs(args: unknown): args is { token_address: string, token_id: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "token_id" in args &&
        typeof (args as { token_id: string }).token_id === "string"
    );
}

function isGetPrivateERC721TotalSupplyArgs(args: unknown): args is { token_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string"
    );
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

function isEncryptValueArgs(args: unknown): args is { message: string, contract_address: string, function_selector: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "message" in args &&
        typeof (args as { message: string }).message === "string" &&
        "contract_address" in args &&
        typeof (args as { contract_address: string }).contract_address === "string" &&
        "function_selector" in args &&
        typeof (args as { function_selector: string }).function_selector === "string"
    );
}

function isDecryptValueArgs(args: unknown): args is { ciphertext: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "ciphertext" in args &&
        typeof (args as { ciphertext: string }).ciphertext === "string"
    );
}

function isDeployPrivateERC721ContractArgs(args: unknown): args is { name: string, symbol: string, gas_limit?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "name" in args &&
        typeof (args as { name: string }).name === "string" &&
        "symbol" in args &&
        typeof (args as { symbol: string }).symbol === "string" &&
        (!("gas_limit" in args) || typeof (args as { gas_limit: string }).gas_limit === "string")
    );
}

function isChangeDefaultAccountArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "account_address" in args &&
        typeof (args as { account_address: string }).account_address === "string"
    );
}

function isGenerateAesKeyArgs(args: unknown): args is { account_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        typeof (args as { account_address: string }).account_address === "string"
    );
}

function isGetTransactionStatusArgs(args: unknown): args is { transaction_hash: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "transaction_hash" in args &&
        typeof (args as any).transaction_hash === "string"
    );
}

function isGetTransactionLogsArgs(args: unknown): args is { transaction_hash: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "transaction_hash" in args &&
        typeof (args as any).transaction_hash === "string"
    );
}

function isDecodeEventDataArgs(args: unknown): args is { topics: string[]; data: string; abi?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "topics" in args &&
        Array.isArray((args as { topics: string[] }).topics) &&
        "data" in args &&
        typeof (args as { data: string }).data === "string" &&
        (!("abi" in args) || typeof (args as { abi: string }).abi === "string")
    );
}

function isCallContractFunctionArgs(args: unknown): args is { contract_address: string, function_name: string, function_args: string[], abi?: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "contract_address" in args &&
        typeof (args as { contract_address: string }).contract_address === "string" &&
        "function_name" in args &&
        typeof (args as { function_name: string }).function_name === "string" &&
        "function_args" in args &&
        Array.isArray((args as { function_args: string[] }).function_args)
    );
}



async function performEncryptValue(message: bigint | number | string, contractAddress: string, functionSelector: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        const encryptedMessage = await wallet.encryptValue(message, contractAddress, functionSelector);
        
        const encryptedMessageString = typeof encryptedMessage === 'object' ? 
            encryptedMessage.toString() : String(encryptedMessage);
        
        return `Encrypted Message: ${encryptedMessageString}`;
    } catch (error) {
        console.error('Error encrypting message:', error);
        throw new Error(`Failed to encrypt message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performDecryptValue(ciphertext: bigint) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        const decryptedMessage = await wallet.decryptValue(ciphertext);
        
        return `Decrypted Message: ${decryptedMessage}`;
    } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error(`Failed to decrypt message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performTransferPrivateERC721Token(token_address: string, recipient_address: string, token_id: string, use_safe_transfer: boolean = false, gas_limit?: string) {
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

async function performDeployPrivateERC721Contract(name: string, symbol: string, gas_limit?: string) {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const bytecode = "0x60806040523480156200001157600080fd5b5060405162001eeb38038062001eeb833981016040819052620000349162000123565b818160006200004483826200021c565b5060016200005382826200021c565b5050505050620002e8565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200008657600080fd5b81516001600160401b0380821115620000a357620000a36200005e565b604051601f8301601f19908116603f01168101908282118183101715620000ce57620000ce6200005e565b81604052838152602092508683858801011115620000eb57600080fd5b600091505b838210156200010f5785820183015181830184015290820190620000f0565b600093810190920192909252949350505050565b600080604083850312156200013757600080fd5b82516001600160401b03808211156200014f57600080fd5b6200015d8683870162000074565b935060208501519150808211156200017457600080fd5b50620001838582860162000074565b9150509250929050565b600181811c90821680620001a257607f821691505b602082108103620001c357634e487b7160e01b600052602260045260246000fd5b50919050565b601f8211156200021757600081815260208120601f850160051c81016020861015620001f25750805b601f850160051c820191505b818110156200021357828155600101620001fe565b5050505b505050565b81516001600160401b038111156200023857620002386200005e565b62000250816200024984546200018d565b84620001c9565b602080601f8311600181146200028857600084156200026f5750858301515b600019600386901b1c1916600185901b17855562000213565b600085815260208120601f198616915b82811015620002b95788860151825594840194600190910190840162000298565b5085821015620002d85787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b611bf380620002f86000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c80636352211e11610097578063a22cb46511610066578063a22cb465146101f0578063b88d4fde14610203578063c87b56dd14610216578063e985e9c51461023657600080fd5b80636352211e146101af57806368862e1b146101c257806370a08231146101d557806395d89b41146101e857600080fd5b8063095ea7b3116100d3578063095ea7b31461016257806318160ddd1461017757806323b872dd1461018957806342842e0e1461019c57600080fd5b806301ffc9a7146100fa57806306fdde0314610122578063081812fc14610137575b600080fd5b61010d61010836600461153e565b610272565b60405190151581526020015b60405180910390f35b61012a6102ad565b60405161011991906115a1565b61014a6101453660046115b4565b61033f565b6040516001600160a01b039091168152602001610119565b6101756101703660046115e9565b610368565b005b6007545b604051908152602001610119565b610175610197366004611613565b610377565b6101756101aa366004611613565b610420565b61014a6101bd3660046115b4565b610440565b6101756101d036600461164f565b61044b565b61017b6101e33660046116a4565b610480565b61012a6104e1565b6101756101fe3660046116bf565b6104f0565b6101756102113660046117f3565b6104fb565b6102296102243660046115b4565b610512565b604051610119919061185b565b61010d6102443660046118ab565b6001600160a01b03918216600090815260056020908152604080832093909416825291909152205460ff1690565b60007fffffffff00000000000000000000000000000000000000000000000000000000821615806102a757506102a78261058f565b92915050565b6060600080546102bc906118de565b80601f01602080910402602001604051908101604052809291908181526020018280546102e8906118de565b80156103355780601f1061030a57610100808354040283529160200191610335565b820191906000526020600020905b81548152906001019060200180831161031857829003601f168201915b5050505050905090565b600061034a82610626565b506000828152600460205260409020546001600160a01b03166102a7565b610373828233610678565b5050565b6001600160a01b0382166103a657604051633250574960e11b8152600060048201526024015b60405180910390fd5b60006103b3838333610685565b9050836001600160a01b0316816001600160a01b03161461041a576040517f64283d7b0000000000000000000000000000000000000000000000000000000081526001600160a01b038086166004830152602482018490528216604482015260640161039d565b50505050565b61043b838383604051806020016040528060008152506104fb565b505050565b60006102a782610626565b600754610458838261071b565b610463338284610799565b600160076000828254610476919061192e565b9091555050505050565b60006001600160a01b0382166104c5576040517f89c62b640000000000000000000000000000000000000000000000000000000081526000600482015260240161039d565b506001600160a01b031660009081526003602052604090205490565b6060600180546102bc906118de565b6103733383836107bb565b610506848484610377565b61041a84848484610891565b604080516020808201835260608252600084815260068252839020835160019091018054808402830186018652928201838152939491939092849284919084018282801561057f57602002820191906000526020600020905b81548152602001906001019080831161056b575b5050505050815250509050919050565b60007fffffffff0000000000000000000000000000000000000000000000000000000082167f80ac58cd0000000000000000000000000000000000000000000000000000000014806102a757507f01ffc9a7000000000000000000000000000000000000000000000000000000007fffffffff000000000000000000000000000000000000000000000000000000008316146102a7565b6000818152600260205260408120546001600160a01b0316806102a7576040517f7e2732890000000000000000000000000000000000000000000000000000000081526004810184905260240161039d565b61043b8383836001610a04565b60008281526006602090815260408083208151815480850282018401845293810184815285946106f49492939284929184918401828280156106e657602002820191906000526020600020905b8154815260200190600101908083116106d2575b505050505081525050610b5a565b90506000610703868686610c2a565b90506107128686846000610d3b565b95945050505050565b6001600160a01b03821661074557604051633250574960e11b81526000600482015260240161039d565b600061075383836000610685565b90506001600160a01b0381161561043b576040517f73c6ac6e0000000000000000000000000000000000000000000000000000000081526000600482015260240161039d565b60006107ac6107a7836119ea565b610e2a565b905061041a8484836001610d3b565b6001600160a01b038216610806576040517f5b08ba180000000000000000000000000000000000000000000000000000000081526001600160a01b038316600482015260240161039d565b6001600160a01b0383811660008181526005602090815260408083209487168084529482529182902080547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff001686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b6001600160a01b0383163b1561041a576040517f150b7a020000000000000000000000000000000000000000000000000000000081526001600160a01b0384169063150b7a02906108ec903390889087908790600401611ada565b6020604051808303816000875af1925050508015610927575060408051601f3d908101601f1916820190925261092491810190611b16565b60015b610990573d808015610955576040519150601f19603f3d011682016040523d82523d6000602084013e61095a565b606091505b50805160000361098857604051633250574960e11b81526001600160a01b038516600482015260240161039d565b805181602001fd5b7fffffffff0000000000000000000000000000000000000000000000000000000081167f150b7a0200000000000000000000000000000000000000000000000000000000146109fd57604051633250574960e11b81526001600160a01b038516600482015260240161039d565b5050505050565b8080610a1857506001600160a01b03821615155b15610b12576000610a2884610626565b90506001600160a01b03831615801590610a545750826001600160a01b0316816001600160a01b031614155b8015610a8657506001600160a01b0380821660009081526005602090815260408083209387168352929052205460ff16155b15610ac8576040517fa9fbf51f0000000000000000000000000000000000000000000000000000000081526001600160a01b038416600482015260240161039d565b8115610b105783856001600160a01b0316826001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b5050600090815260046020526040902080547fffffffffffffffffffffffff0000000000000000000000000000000000000000166001600160a01b0392909216919091179055565b6040805160208101909152606081528151516040805160208101909152600090808367ffffffffffffffff811115610b9457610b946116f0565b604051908082528060200260200182016040528015610bbd578160200160208202803683370190505b509052905060005b82811015610c2257610bf385600001518281518110610be657610be6611b33565b6020026020010151610faa565b8251805183908110610c0757610c07611b33565b6020908102919091010152610c1b81611b49565b9050610bc5565b509392505050565b6000828152600260205260408120546001600160a01b0390811690831615610c5757610c57818486611047565b6001600160a01b03811615610c9557610c74600085600080610a04565b6001600160a01b038116600090815260036020526040902080546000190190555b6001600160a01b03851615610cc4576001600160a01b0385166000908152600360205260409020805460010190555b60008481526002602052604080822080547fffffffffffffffffffffffff0000000000000000000000000000000000000000166001600160a01b0389811691821790925591518793918516917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4949350505050565b6000610d4684610440565b6001600160a01b031603610d89576040517f868439130000000000000000000000000000000000000000000000000000000081526004810184905260240161039d565b6000610d9583866110dd565b90508115610df457600084815260066020908152604090912082518051805185948492610dc892849291909101906114ad565b5050506020828101518051805191926001850192610de992849201906114ad565b5050509050506109fd565b60208082015160008681526006835260409020815180519293600190920192610e2092849201906114ad565b5050505050505050565b604080516020810190915260608152602082015151825151518114610eab576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601c60248201527f4d50435f434f52453a20494e56414c49445f494e5055545f5445585400000000604482015260640161039d565b600060405180602001604052808367ffffffffffffffff811115610ed157610ed16116f0565b604051908082528060200260200182016040528015610efa578160200160208202803683370190505b50905260408051808201909152600081526060602082015290915060005b83811015610fa057855151805182908110610f3557610f35611b33565b6020908102919091018101518352860151805182908110610f5857610f58611b33565b60200260200101518260200181905250610f7182611128565b8351805183908110610f8557610f85611b33565b6020908102919091010152610f9981611b49565b9050610f18565b5090949350505050565b6000606463d2c135e560045b60f81b846040518363ffffffff1660e01b81526004016110049291907fff00000000000000000000000000000000000000000000000000000000000000929092168252602082015260400190565b6020604051808303816000875af1158015611023573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102a79190611b63565b611052838383611191565b61043b576001600160a01b038316611099576040517f7e2732890000000000000000000000000000000000000000000000000000000081526004810182905260240161039d565b6040517f177e802f0000000000000000000000000000000000000000000000000000000081526001600160a01b03831660048201526024810182905260440161039d565b6111086040805160608082018352818301818152825282516020818101909452908152909182015290565b61111183611217565b815261111d83836112df565b602082015292915050565b805160208201516040517fe4f36e1000000000000000000000000000000000000000000000000000000000815260009260649263e4f36e1092611004927f0400000000000000000000000000000000000000000000000000000000000000929091600401611b7c565b60006001600160a01b0383161580159061120f5750826001600160a01b0316846001600160a01b031614806111eb57506001600160a01b0380851660009081526005602090815260408083209387168352929052205460ff165b8061120f57506000828152600460205260409020546001600160a01b038481169116145b949350505050565b6040805160208101909152606081528151516040805160208101909152600090808367ffffffffffffffff811115611251576112516116f0565b60405190808252806020026020018201604052801561127a578160200160208202803683370190505b509052905060005b82811015610c22576112b0856000015182815181106112a3576112a3611b33565b60200260200101516113b1565b82518051839081106112c4576112c4611b33565b60209081029190910101526112d881611b49565b9050611282565b6040805160208101909152606081528251516040805160208101909152600090808367ffffffffffffffff811115611319576113196116f0565b604051908082528060200260200182016040528015611342578160200160208202803683370190505b509052905060005b828110156113a8576113798660000151828151811061136b5761136b611b33565b6020026020010151866113c1565b825180518390811061138d5761138d611b33565b60209081029190910101526113a181611b49565b905061134a565b50949350505050565b6000606463c50c9c026004610fb6565b60408051606083901b7fffffffffffffffffffffffffffffffffffffffff0000000000000000000000001660208201528151601481830301815260348201928390527f3c6f0e6800000000000000000000000000000000000000000000000000000000909252600091606491633c6f0e6891611463917f0400000000000000000000000000000000000000000000000000000000000000918891603801611b7c565b6020604051808303816000875af1158015611482573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906114a69190611b63565b9392505050565b8280548282559060005260206000209081019282156114e8579160200282015b828111156114e85782518255916020019190600101906114cd565b506114f49291506114f8565b5090565b5b808211156114f457600081556001016114f9565b7fffffffff000000000000000000000000000000000000000000000000000000008116811461153b57600080fd5b50565b60006020828403121561155057600080fd5b81356114a68161150d565b6000815180845260005b8181101561158157602081850181015186830182015201611565565b506000602082860101526020601f19601f83011685010191505092915050565b6020815260006114a6602083018461155b565b6000602082840312156115c657600080fd5b5035919050565b80356001600160a01b03811681146115e457600080fd5b919050565b600080604083850312156115fc57600080fd5b611605836115cd565b946020939093013593505050565b60008060006060848603121561162857600080fd5b611631846115cd565b925061163f602085016115cd565b9150604084013590509250925092565b6000806040838503121561166257600080fd5b61166b836115cd565b9150602083013567ffffffffffffffff81111561168757600080fd5b83016040818603121561169957600080fd5b809150509250929050565b6000602082840312156116b657600080fd5b6114a6826115cd565b600080604083850312156116d257600080fd5b6116db836115cd565b91506020830135801515811461169957600080fd5b634e487b7160e01b600052604160045260246000fd5b6040805190810167ffffffffffffffff81118282101715611729576117296116f0565b60405290565b6040516020810167ffffffffffffffff81118282101715611729576117296116f0565b604051601f8201601f1916810167ffffffffffffffff8111828210171561177b5761177b6116f0565b604052919050565b600082601f83011261179457600080fd5b813567ffffffffffffffff8111156117ae576117ae6116f0565b6117c16020601f19601f84011601611752565b8181528460208386010111156117d657600080fd5b816020850160208301376000918101602001919091529392505050565b6000806000806080858703121561180957600080fd5b611812856115cd565b9350611820602086016115cd565b925060408501359150606085013567ffffffffffffffff81111561184357600080fd5b61184f87828801611783565b91505092959194509250565b6020808252825182820182905280516040840181905260009291820190839060608601905b808310156118a05783518252928401926001929092019190840190611880565b509695505050505050565b600080604083850312156118be57600080fd5b6118c7836115cd565b91506118d5602084016115cd565b90509250929050565b600181811c908216806118f257607f821691505b60208210810361191257634e487b7160e01b600052602260045260246000fd5b50919050565b634e487b7160e01b600052601160045260246000fd5b808201808211156102a7576102a7611918565b600067ffffffffffffffff82111561195b5761195b6116f0565b5060051b60200190565b600082601f83011261197657600080fd5b8135602061198b61198683611941565b611752565b82815260059290921b840181019181810190868411156119aa57600080fd5b8286015b848110156118a057803567ffffffffffffffff8111156119ce5760008081fd5b6119dc8986838b0101611783565b8452509183019183016119ae565b6000604082360312156119fc57600080fd5b611a04611706565b823567ffffffffffffffff80821115611a1c57600080fd5b81850191506020808336031215611a3257600080fd5b611a3a61172f565b833583811115611a4957600080fd5b939093019236601f850112611a5d57600080fd5b8335611a6b61198682611941565b81815260059190911b85018301908381019036831115611a8a57600080fd5b958401955b82871015611aa857863582529584019590840190611a8f565b83525050845285810135925081831115611ac157600080fd5b611acd36848801611965565b9084015250909392505050565b60006001600160a01b03808716835280861660208401525083604083015260806060830152611b0c608083018461155b565b9695505050505050565b600060208284031215611b2857600080fd5b81516114a68161150d565b634e487b7160e01b600052603260045260246000fd5b60006000198203611b5c57611b5c611918565b5060010190565b600060208284031215611b7557600080fd5b5051919050565b7fff0000000000000000000000000000000000000000000000000000000000000084168152826020820152606060408201526000610712606083018461155b56fea264697066735822122032cc9569a57d1b107f163af7fd375b58451772f82279883207242aa0372e125964736f6c63430008130033"
           
        const factory = new ethers.ContractFactory(
            ERC721_ABI,
            bytecode,
            wallet
        );
        
        const txOptions: any = {};
        if (gas_limit) {
            txOptions.gasLimit = gas_limit;
        }
        
        const contract = await factory.deploy(name, symbol, txOptions);

        const receipt = await contract.deploymentTransaction();
        const contractAddress = await contract.getAddress();
        
        return `Private ERC721 Contract Deployment Successful!\nName: ${name}\nSymbol: ${symbol}\nContract Address: ${contractAddress}\nTransaction Hash: ${receipt?.hash}\n\nYou can now use this contract address with other NFT operations.`;
    } catch (error) {
        console.error('Error deploying private ERC721 contract:', error);
        throw new Error(`Failed to deploy private ERC721 contract: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performGetPrivateERC721TokenURI(token_address: string, token_id: string) {
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
        
        const encryptedTokenURI = await tokenContract.tokenURI(BigInt(token_id));

        let tokenURI;
        try {
            tokenURI = await wallet.decryptValue(encryptedTokenURI);
        } catch (decryptError) {
            tokenURI = decryptError;
        }
        
        return `Token: ${nameResult} (${symbolResult})\nToken ID: ${token_id}\nDecrypted Token URI: ${tokenURI}`;
    } catch (error) {
        throw new Error(`Failed to get private ERC721 token URI: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Gets the owner address of a private ERC721 NFT token
 * @param token_address The address of the ERC721 token contract
 * @param token_id The ID of the token to check ownership for
 * @returns A formatted string with the token owner information
 */
async function performGetPrivateERC721TokenOwner(token_address: string, token_id: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const currentAccountKeys = getCurrentAccountKeys();
        
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        
        const ownerAddress = await tokenContract.ownerOf(token_id);
        
        return `Token: ${name} (${symbol})\nToken ID: ${token_id}\nOwner Address: ${ownerAddress}`;
    } catch (error) {
        console.error('Error getting private ERC721 token owner:', error);
        throw new Error(`Failed to get private ERC721 token owner: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Gets the total supply of tokens for a private ERC721 NFT collection
 * @param token_address The address of the ERC721 token contract
 * @returns A formatted string with the total supply information
 */
async function performGetPrivateERC721TotalSupply(token_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const currentAccountKeys = getCurrentAccountKeys();
        
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        wallet.setAesKey(currentAccountKeys.aesKey);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        
        const totalSupply = await tokenContract.totalSupply();
        
        return `Collection: ${name} (${symbol})\nTotal Supply: ${totalSupply.toString()} tokens`;
    } catch (error) {
        console.error('Error getting private ERC721 total supply:', error);
        throw new Error(`Failed to get private ERC721 total supply: ${error instanceof Error ? error.message : String(error)}`);
    }
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

async function performChangeDefaultAccount(account_address: string) {
    try {
        const accountKeys = getAccountKeys(account_address);
        
        if (!accountKeys) {
            throw new Error(`Account ${account_address} not found`);
        }
        
        process.env.COTI_MCP_CURRENT_PUBLIC_KEY = account_address;
        
        return `Default account successfully changed to: ${account_address}`;
    } catch (error) {
        console.error('Error changing default account:', error);
        throw new Error(`Failed to change default account: ${error instanceof Error ? error.message : String(error)}`);
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