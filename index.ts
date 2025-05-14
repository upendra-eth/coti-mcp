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
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{
      components: [
        { name: "ciphertext", type: "uint256" },
        { name: "ownerCiphertext", type: "uint256" },
        { name: "spenderCiphertext", type: "uint256" }
      ],
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  },
];

const ERC721_ABI = [
  {
    constant: false,
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    name: "safeTransferFrom",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    type: "function"
  }
];

const GET_COTI_NATIVE_BALANCE: Tool = {
    name: "get_native_balance",
    description:
        "Get the native COTI token balance of a COTI blockchain account. " +
        "This is used for checking the current balance of a COTI account. " +
        "Requires a COTI account address as input. " +
        "Returns the account balance in COTI tokens.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
            }
        },
        required: ["account_address"],
    },
};

const GET_PRIVATE_ERC20_TOKEN_BALANCE: Tool = {
    name: "get_private_erc20_balance",
    description:
        "Get the balance of a private ERC20 token on the COTI blockchain. " +
        "This is used for checking the current balance of a private token for a COTI account. " +
        "Requires a COTI account address and token contract address as input. " +
        "Returns the decrypted token balance.",
    inputSchema: {
        type: "object",
        properties: {
            account_address: {
                type: "string",
                description: "COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
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
    name: "transfer_native",
    description:
        "Transfer native COTI tokens to another wallet. " +
        "This is used for sending COTI tokens from your wallet to another address. " +
        "Requires recipient address and amount in Wei as input. " +
        "Returns the transaction hash upon successful transfer.",
    inputSchema: {
        type: "object",
        properties: {
            recipient_address: {
                type: "string",
                description: "Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
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
    name: "transfer_private_erc20",
    description:
        "Transfer private ERC20 tokens on the COTI blockchain. " +
        "This is used for sending private tokens from your wallet to another address. " +
        "Requires token contract address, recipient address, and amount as input. " +
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
                description: "Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273",
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

const GET_PRIVATE_ERC20_TOKEN_ALLOWANCE: Tool = {
    name: "get_private_erc20_allowance",
    description:
        "Get the allowance of a private ERC20 token on the COTI blockchain. " +
        "This is used for checking how much a spender is allowed to spend on behalf of an owner. " +
        "Requires token contract address, owner address, and spender address as input. " +
        "Returns the decrypted allowance amount.",
    inputSchema: {
        type: "object",
        properties: {
            token_address: {
                type: "string",
                description: "ERC20 token contract address on COTI blockchain",
            },
            owner_address: {
                type: "string",
                description: "Owner address that has granted the allowance",
            },
            spender_address: {
                type: "string",
                description: "Spender address that can spend the tokens",
            },
        },
        required: ["token_address", "owner_address", "spender_address"],
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

const COTI_MCP_PUBLIC_KEY = process.env.COTI_MCP_PUBLIC_KEY!;
if (!COTI_MCP_PUBLIC_KEY) {
    console.error("Error: COTI_MCP_PUBLIC_KEY environment variable is required");
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

function isGetPrivateERC20TokenAllowanceArgs(args: unknown): args is { token_address: string, owner_address: string, spender_address: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "token_address" in args &&
        typeof (args as { token_address: string }).token_address === "string" &&
        "owner_address" in args &&
        typeof (args as { owner_address: string }).owner_address === "string" &&
        "spender_address" in args &&
        typeof (args as { spender_address: string }).spender_address === "string"
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
        
        return `Balance: ${formattedBalance}\nDecimals: ${decimalsResult}\nSymbol: ${symbolResult}`;
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

        const encryptedAmount = await wallet.encryptValue(amount_wei, token_address, tokenContract.transfer.fragment.selector);
        
        const tx = await tokenContract.transfer(recipient_address, encryptedAmount, txOptions);
        
        const receipt = await tx.wait();
        
        return `Private Token Transfer Successful!\nToken: ${symbolResult}\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nRecipient: ${recipient_address}\nTransfer Function Selector: ${tokenContract.transfer.fragment.selector}`;
    } catch (error) {
        console.error('Error transferring private ERC20 tokens:', error);
        throw new Error(`Failed to transfer private ERC20 tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performEncryptValue(message: bigint | number | string, contractAddress: string, functionSelector: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
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
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        const decryptedMessage = await wallet.decryptValue(ciphertext);
        
        return `Decrypted Message: ${decryptedMessage}`;
    } catch (error) {
        console.error('Error decrypting message:', error);
        throw new Error(`Failed to decrypt message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performTransferPrivateERC721Token(token_address: string, recipient_address: string, token_id: string, use_safe_transfer: boolean = false, gas_limit?: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
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

async function performGetPrivateERC721TokenURI(token_address: string, token_id: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
        const tokenContract = new Contract(token_address, ERC721_ABI, wallet);
        
        const [symbolResult, nameResult] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name()
        ]);
        
        const encryptedTokenURI = await tokenContract.tokenURI(token_id);
        
        let tokenURI;
        try {
            tokenURI = await wallet.decryptValue(encryptedTokenURI);
        } catch (decryptError) {
            tokenURI = encryptedTokenURI;
        }
        
        return `Token: ${nameResult} (${symbolResult})\nToken ID: ${token_id}\nToken URI: ${tokenURI}`;
    } catch (error) {
        console.error('Error getting private ERC721 token URI:', error);
        throw new Error(`Failed to get private ERC721 token URI: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function performGetPrivateERC20TokenAllowance(token_address: string, owner_address: string, spender_address: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
        const tokenContract = new Contract(token_address, ERC20_ABI, wallet);
        
        const [decimalsResult, symbolResult] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol()
        ]);
        
        const allowanceData = await tokenContract.allowance(owner_address, spender_address);
        
        // The allowance method returns a tuple with ciphertext, ownerCiphertext, and spenderCiphertext
        // We need to decrypt the main ciphertext to get the allowance amount
        let decryptedAllowance;
        let allowanceDetails = '';
        
        if (typeof allowanceData === 'object' && 'ciphertext' in allowanceData) {
            decryptedAllowance = await wallet.decryptValue(allowanceData.ciphertext);
            allowanceDetails = `\nAllowance Ciphertext: ${allowanceData.ciphertext}\nOwner Ciphertext: ${allowanceData.ownerCiphertext}\nSpender Ciphertext: ${allowanceData.spenderCiphertext}`;
        } else {
            // If the result is not a tuple, it might be directly the encrypted allowance
            decryptedAllowance = await wallet.decryptValue(allowanceData);
            allowanceDetails = `\nAllowance Data: ${allowanceData}`;
        }
        
        const formattedAllowance = ethers.formatUnits(decryptedAllowance, decimalsResult);
        
        return `Token: ${symbolResult}\nOwner: ${owner_address}\nSpender: ${spender_address}\nDecrypted Allowance: ${formattedAllowance}\nDecimals: ${decimalsResult}${allowanceDetails}`;
    } catch (error) {
        console.error('Error getting private ERC20 token allowance:', error);
        throw new Error(`Failed to get private ERC20 token allowance: ${error instanceof Error ? error.message : String(error)}`);
    }
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        GET_COTI_NATIVE_BALANCE, 
        GET_PRIVATE_ERC20_TOKEN_BALANCE, 
        TRANSFER_NATIVE_COTI, 
        TRANSFER_PRIVATE_ERC20_TOKEN, 
        TRANSFER_PRIVATE_ERC721_TOKEN,
        GET_PRIVATE_ERC721_TOKEN_URI,
        GET_PRIVATE_ERC20_TOKEN_ALLOWANCE,
        ENCRYPT_VALUE, 
        DECRYPT_VALUE
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;

        if (!args) {
            throw new Error("No arguments provided");
        }

        switch (name) {
            case "get_native_balance": {
                if (!isGetCotiBalanceArgs(args)) {
                    throw new Error("Invalid arguments for get_native_balance");
                }
                const { account_address } = args;

                const results = await performGetCotiBalance(account_address);
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
                if (!isTransferNativeCotiArgs(args)) {
                    throw new Error("Invalid arguments for transfer_native");
                }
                const { recipient_address, amount_wei, gas_limit } = args;

                const results = await performTransferNativeCoti(recipient_address, amount_wei, gas_limit);
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
            
            case "get_private_erc20_allowance": {
                if (!isGetPrivateERC20TokenAllowanceArgs(args)) {
                    throw new Error("Invalid arguments for get_private_erc20_allowance");
                }
                const { token_address, owner_address, spender_address } = args;

                const results = await performGetPrivateERC20TokenAllowance(
                    token_address, 
                    owner_address, 
                    spender_address
                );
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