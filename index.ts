#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { CotiNetwork, getDefaultProvider, Wallet, Contract, ethers } from '@coti-io/coti-ethers';
import { buildInputText, ctString, decryptString, itString } from '@coti-io/coti-sdk-typescript';

const ERC20_ABI = [
  // Basic ERC20 functions
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  
  // Balance functions
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  
  // Allowance functions
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
  
  // Approve functions
  {
    inputs: [
      { name: "spender", type: "address" },
      { 
        components: [
          { name: "ciphertext", type: "uint256" },
          { name: "signature", type: "bytes" }
        ],
        name: "value",
        type: "tuple"
      }
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // Transfer functions
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { 
        components: [
          { internalType: "ctUint64", name: "ciphertext", type: "uint256" },
          { internalType: "bytes", name: "signature", type: "bytes" }
        ],
        internalType: "struct itUint64",
        name: "value",
        type: "tuple"
      }
    ],
    name: "transfer",
    outputs: [{ internalType: "gtBool", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // TransferFrom functions
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { 
        components: [
          { name: "ciphertext", type: "uint256" },
          { name: "signature", type: "bytes" }
        ],
        name: "value",
        type: "tuple"
      }
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  
  // Additional functions
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accountEncryptionAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "isSpender", type: "bool" }
    ],
    name: "reencryptAllowance",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "offBoardAddress", type: "address" }],
    name: "setAccountEncryptionAddress",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const ERC721_ABI = [
    // Constructor
    {
        inputs: [
            {
                internalType: "string",
                name: "name",
                type: "string"
            },
            {
                internalType: "string",
                name: "symbol",
                type: "string"
            }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
    },
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
    inputs: [
        {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256"
        }
    ],
    name: "tokenURI",
    outputs: [
        {
            components: [
                {
                    internalType: "ctUint64[]",
                    name: "value",
                    type: "uint256[]"
                }
            ],
            internalType: "struct ctString",
            name: "",
            type: "tuple"
        }
    ],
    stateMutability: "view",
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

        const transferSelector = tokenContract.transfer.fragment.selector;

        const encryptedInputText = buildInputText(BigInt(amount_wei), 
        { wallet: wallet, userKey: COTI_MCP_AES_KEY }, token_address, transferSelector);

        const tx = await tokenContract.transfer(recipient_address, encryptedInputText, txOptions);
        
        const receipt = await tx.wait();

        return `Private Token Transfer Successful!\nToken: ${symbolResult}\nTransaction Hash: ${receipt?.hash}\nAmount in Wei: ${amount_wei}\nRecipient: ${recipient_address}\nTransfer Function Selector: ${transferSelector}`;
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

async function performDeployPrivateERC721Contract(name: string, symbol: string, gas_limit?: string) {
    try {
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
        const bytecode = "0x60806040523480156200001157600080fd5b506040516200323c3803806200323c8339818101604052810190620000379190620001fa565b818181600090816200004a9190620004ca565b5080600190816200005c9190620004ca565b5050505050620005b1565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b620000d08262000085565b810181811067ffffffffffffffff82111715620000f257620000f162000096565b5b80604052505050565b60006200010762000067565b9050620001158282620000c5565b919050565b600067ffffffffffffffff82111562000138576200013762000096565b5b620001438262000085565b9050602081019050919050565b60005b838110156200017057808201518184015260208101905062000153565b60008484015250505050565b6000620001936200018d846200011a565b620000fb565b905082815260208101848484011115620001b257620001b162000080565b5b620001bf84828562000150565b509392505050565b600082601f830112620001df57620001de6200007b565b5b8151620001f18482602086016200017c565b91505092915050565b6000806040838503121562000214576200021362000071565b5b600083015167ffffffffffffffff81111562000235576200023462000076565b5b6200024385828601620001c7565b925050602083015167ffffffffffffffff81111562000267576200026662000076565b5b6200027585828601620001c7565b9150509250929050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680620002d257607f821691505b602082108103620002e857620002e76200028a565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302620003527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000313565b6200035e868362000313565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b6000620003ab620003a56200039f8462000376565b62000380565b62000376565b9050919050565b6000819050919050565b620003c7836200038a565b620003df620003d682620003b2565b84845462000320565b825550505050565b600090565b620003f6620003e7565b62000403818484620003bc565b505050565b5b818110156200042b576200041f600082620003ec565b60018101905062000409565b5050565b601f8211156200047a576200044481620002ee565b6200044f8462000303565b810160208510156200045f578190505b620004776200046e8562000303565b83018262000408565b50505b505050565b600082821c905092915050565b60006200049f600019846008026200047f565b1980831691505092915050565b6000620004ba83836200048c565b9150826002028217905092915050565b620004d5826200027f565b67ffffffffffffffff811115620004f157620004f062000096565b5b620004fd8254620002b9565b6200050a8282856200042f565b600060209050601f8311600181146200054257600084156200052d578287015190505b620005398582620004ac565b865550620005a9565b601f1984166200055286620002ee565b60005b828110156200057c5784890151825560018201915060208501945060208101905062000555565b868310156200059c578489015162000598601f8916826200048c565b8355505b6001600288020188555050505b505050505050565b612c7b80620005c16000396000f3fe608060405234801561001057600080fd5b50600436106100ea5760003560e01c806370a082311161008c578063a33a387311610066578063a33a38731461025b578063b88d4fde14610277578063c87b56dd14610293578063e985e9c5146102c3576100ea565b806370a08231146101f157806395d89b4114610221578063a22cb4651461023f576100ea565b8063095ea7b3116100c8578063095ea7b31461016d57806323b872dd1461018957806342842e0e146101a55780636352211e146101c1576100ea565b806301ffc9a7146100ef57806306fdde031461011f578063081812fc1461013d575b600080fd5b61010960048036038101906101049190611e57565b6102f3565b6040516101169190611e9f565b60405180910390f35b610127610350565b6040516101349190611f4a565b60405180910390f35b61015760048036038101906101529190611fa2565b6103e2565b6040516101649190612010565b60405180910390f35b61018760048036038101906101829190612057565b6103fe565b005b6101a3600480360381019061019e9190612097565b610414565b005b6101bf60048036038101906101ba9190612097565b610516565b005b6101db60048036038101906101d69190611fa2565b610536565b6040516101e89190612010565b60405180910390f35b61020b600480360381019061020691906120ea565b610548565b6040516102189190612126565b60405180910390f35b610229610602565b6040516102369190611f4a565b60405180910390f35b6102596004803603810190610254919061216d565b610694565b005b610275600480360381019061027091906121d1565b6106aa565b005b610291600480360381019061028c919061234f565b61073e565b005b6102ad60048036038101906102a89190611fa2565b61075b565b6040516102ba91906124e6565b60405180910390f35b6102dd60048036038101906102d89190612508565b6107e3565b6040516102ea9190611e9f565b60405180910390f35b60008060e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19161480610349575061034882610877565b5b9050919050565b60606000805461035f90612577565b80601f016020809104026020016040519081016040528092919081815260200182805461038b90612577565b80156103d85780601f106103ad576101008083540402835291602001916103d8565b820191906000526020600020905b8154815290600101906020018083116103bb57829003601f168201915b5050505050905090565b60006103ed826108f1565b506103f782610979565b9050919050565b610410828261040b6109b6565b6109be565b5050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036104865760006040517f64a0ae9200000000000000000000000000000000000000000000000000000000815260040161047d9190612010565b60405180910390fd5b600061049a83836104956109b6565b6109d0565b90508373ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614610510578382826040517f64283d7b000000000000000000000000000000000000000000000000000000008152600401610507939291906125a8565b60405180910390fd5b50505050565b6105318383836040518060200160405280600081525061073e565b505050565b6000610541826108f1565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036105bb5760006040517f89c62b640000000000000000000000000000000000000000000000000000000081526004016105b29190612010565b60405180910390fd5b600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b60606001805461061190612577565b80601f016020809104026020016040519081016040528092919081815260200182805461063d90612577565b801561068a5780601f1061065f5761010080835404028352916020019161068a565b820191906000526020600020905b81548152906001019060200180831161066d57829003601f168201915b5050505050905090565b6106a661069f6109b6565b8383610a7e565b5050565b600060075490506106bb3382610bed565b6106c6338284610c0b565b600760008154809291906106d99061260e565b9190505550803373ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b610749848484610414565b61075584848484610c34565b50505050565b610763611d1b565b60066000838152602001908152602001600020600101604051806020016040529081600082018054806020026020016040519081016040528092919081815260200182805480156107d357602002820191906000526020600020905b8154815260200190600101908083116107bf575b5050505050815250509050919050565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b60007f80ac58cd000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614806108ea57506108e982610deb565b5b9050919050565b6000806108fd83610e55565b9050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361097057826040517f7e2732890000000000000000000000000000000000000000000000000000000081526004016109679190612126565b60405180910390fd5b80915050919050565b60006004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b600033905090565b6109cb8383836001610e92565b505050565b600080610a546006600086815260200190815260200160002060000160405180602001604052908160008201805480602002602001604051908101604052809291908181526020018280548015610a4657602002820191906000526020600020905b815481526020019060010190808311610a32575b505050505081525050611057565b90506000610a63868686611135565b9050610a72868684600061134f565b80925050509392505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610aef57816040517f5b08ba18000000000000000000000000000000000000000000000000000000008152600401610ae69190612010565b60405180910390fd5b80600560008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3183604051610be09190611e9f565b60405180910390a3505050565b610c0782826040518060200160405280600081525061148b565b5050565b6000610c1f82610c1a90612915565b6114a7565b9050610c2e848483600161134f565b50505050565b60008373ffffffffffffffffffffffffffffffffffffffff163b1115610de5578273ffffffffffffffffffffffffffffffffffffffff1663150b7a02610c786109b6565b8685856040518563ffffffff1660e01b8152600401610c9a949392919061297d565b6020604051808303816000875af1925050508015610cd657506040513d601f19601f82011682018060405250810190610cd391906129de565b60015b610d5a573d8060008114610d06576040519150601f19603f3d011682016040523d82523d6000602084013e610d0b565b606091505b506000815103610d5257836040517f64a0ae92000000000000000000000000000000000000000000000000000000008152600401610d499190612010565b60405180910390fd5b805181602001fd5b63150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614610de357836040517f64a0ae92000000000000000000000000000000000000000000000000000000008152600401610dda9190612010565b60405180910390fd5b505b50505050565b60007f01ffc9a7000000000000000000000000000000000000000000000000000000007bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916827bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916149050919050565b60006002600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b8080610ecb5750600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614155b15610fff576000610edb846108f1565b9050600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614158015610f4657508273ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b8015610f595750610f5781846107e3565b155b15610f9b57826040517fa9fbf51f000000000000000000000000000000000000000000000000000000008152600401610f929190612010565b60405180910390fd5b8115610ffd57838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45b505b836004600085815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050505050565b61105f611d2e565b60008260000151519050600060405180602001604052808367ffffffffffffffff8111156110905761108f612224565b5b6040519080825280602002602001820160405280156110be5781602001602082028036833780820191505090505b50815250905060005b8281101561112a576110f6856000015182815181106110e9576110e8612a0b565b5b602002602001015161160e565b8260000151828151811061110d5761110c612a0b565b5b602002602001018181525050806111239061260e565b90506110c7565b508092505050919050565b60008061114184610e55565b9050600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614611183576111828184866116ab565b5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614611214576111c5600085600080610e92565b6001600360008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825403925050819055505b600073ffffffffffffffffffffffffffffffffffffffff168573ffffffffffffffffffffffffffffffffffffffff1614611297576001600360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825401925050819055505b846002600086815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550838573ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4809150509392505050565b600073ffffffffffffffffffffffffffffffffffffffff1661137084610536565b73ffffffffffffffffffffffffffffffffffffffff16036113c857826040517f868439130000000000000000000000000000000000000000000000000000000081526004016113bf9190612126565b60405180910390fd5b60006113d4838661176f565b905081156114485780600660008681526020019081526020016000206000820151816000016000820151816000019080519060200190611415929190611d41565b505050602082015181600101600082015181600001908051906020019061143d929190611d41565b505050905050611484565b806020015160066000868152602001908152602001600020600101600082015181600001908051906020019061147f929190611d41565b509050505b5050505050565b61149583836117a0565b6114a26000848484610c34565b505050565b6114af611d2e565b60008260200151519050808360000151600001515114611504576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016114fb90612a86565b60405180910390fd5b600060405180602001604052808367ffffffffffffffff81111561152b5761152a612224565b5b6040519080825280602002602001820160405280156115595781602001602082028036833780820191505090505b508152509050611567611d8e565b60005b8381101561160257856000015160000151818151811061158d5761158c612a0b565b5b6020026020010151826000018181525050856020015181815181106115b5576115b4612a0b565b5b602002602001015182602001819052506115ce82611899565b836000015182815181106115e5576115e4612a0b565b5b602002602001018181525050806115fb9061260e565b905061156a565b50819350505050919050565b6000606473ffffffffffffffffffffffffffffffffffffffff1663d2c135e56004808111156116405761163f612aa6565b5b60f81b846040518363ffffffff1660e01b8152600401611661929190612b10565b6020604051808303816000875af1158015611680573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906116a49190612b4e565b9050919050565b6116b6838383611940565b61176a57600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff160361172b57806040517f7e2732890000000000000000000000000000000000000000000000000000000081526004016117229190612126565b60405180910390fd5b81816040517f177e802f000000000000000000000000000000000000000000000000000000008152600401611761929190612b7b565b60405180910390fd5b505050565b611777611da8565b61178083611a01565b81600001819052506117928383611adf565b816020018190525092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036118125760006040517f64a0ae920000000000000000000000000000000000000000000000000000000081526004016118099190612010565b60405180910390fd5b6000611820838360006109d0565b9050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16146118945760006040517f73c6ac6e00000000000000000000000000000000000000000000000000000000815260040161188b9190612010565b60405180910390fd5b505050565b6000606473ffffffffffffffffffffffffffffffffffffffff1663e4f36e106004808111156118cb576118ca612aa6565b5b60f81b846000015185602001516040518463ffffffff1660e01b81526004016118f693929190612ba4565b6020604051808303816000875af1158015611915573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906119399190612b4e565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141580156119f857508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff1614806119b957506119b884846107e3565b5b806119f757508273ffffffffffffffffffffffffffffffffffffffff166119df83610979565b73ffffffffffffffffffffffffffffffffffffffff16145b5b90509392505050565b611a09611d1b565b60008260000151519050600060405180602001604052808367ffffffffffffffff811115611a3a57611a39612224565b5b604051908082528060200260200182016040528015611a685781602001602082028036833780820191505090505b50815250905060005b82811015611ad457611aa085600001518281518110611a9357611a92612a0b565b5b6020026020010151611bbf565b82600001518281518110611ab757611ab6612a0b565b5b60200260200101818152505080611acd9061260e565b9050611a71565b508092505050919050565b611ae7611d1b565b60008360000151519050600060405180602001604052808367ffffffffffffffff811115611b1857611b17612224565b5b604051908082528060200260200182016040528015611b465781602001602082028036833780820191505090505b50815250905060005b82811015611bb357611b7f86600001518281518110611b7157611b70612a0b565b5b602002602001015186611c5c565b82600001518281518110611b9657611b95612a0b565b5b60200260200101818152505080611bac9061260e565b9050611b4f565b50809250505092915050565b6000606473ffffffffffffffffffffffffffffffffffffffff1663c50c9c02600480811115611bf157611bf0612aa6565b5b60f81b846040518363ffffffff1660e01b8152600401611c12929190612b10565b6020604051808303816000875af1158015611c31573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611c559190612b4e565b9050919050565b6000606473ffffffffffffffffffffffffffffffffffffffff16633c6f0e68600480811115611c8e57611c8d612aa6565b5b60f81b8585604051602001611ca39190612c2a565b6040516020818303038152906040526040518463ffffffff1660e01b8152600401611cd093929190612ba4565b6020604051808303816000875af1158015611cef573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d139190612b4e565b905092915050565b6040518060200160405280606081525090565b6040518060200160405280606081525090565b828054828255906000526020600020908101928215611d7d579160200282015b82811115611d7c578251825591602001919060010190611d61565b5b509050611d8a9190611dce565b5090565b604051806040016040528060008152602001606081525090565b6040518060400160405280611dbb611d1b565b8152602001611dc8611d1b565b81525090565b5b80821115611de7576000816000905550600101611dcf565b5090565b6000604051905090565b600080fd5b600080fd5b60007fffffffff0000000000000000000000000000000000000000000000000000000082169050919050565b611e3481611dff565b8114611e3f57600080fd5b50565b600081359050611e5181611e2b565b92915050565b600060208284031215611e6d57611e6c611df5565b5b6000611e7b84828501611e42565b91505092915050565b60008115159050919050565b611e9981611e84565b82525050565b6000602082019050611eb46000830184611e90565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b83811015611ef4578082015181840152602081019050611ed9565b60008484015250505050565b6000601f19601f8301169050919050565b6000611f1c82611eba565b611f268185611ec5565b9350611f36818560208601611ed6565b611f3f81611f00565b840191505092915050565b60006020820190508181036000830152611f648184611f11565b905092915050565b6000819050919050565b611f7f81611f6c565b8114611f8a57600080fd5b50565b600081359050611f9c81611f76565b92915050565b600060208284031215611fb857611fb7611df5565b5b6000611fc684828501611f8d565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611ffa82611fcf565b9050919050565b61200a81611fef565b82525050565b60006020820190506120256000830184612001565b92915050565b61203481611fef565b811461203f57600080fd5b50565b6000813590506120518161202b565b92915050565b6000806040838503121561206e5761206d611df5565b5b600061207c85828601612042565b925050602061208d85828601611f8d565b9150509250929050565b6000806000606084860312156120b0576120af611df5565b5b60006120be86828701612042565b93505060206120cf86828701612042565b92505060406120e086828701611f8d565b9150509250925092565b600060208284031215612100576120ff611df5565b5b600061210e84828501612042565b91505092915050565b61212081611f6c565b82525050565b600060208201905061213b6000830184612117565b92915050565b61214a81611e84565b811461215557600080fd5b50565b60008135905061216781612141565b92915050565b6000806040838503121561218457612183611df5565b5b600061219285828601612042565b92505060206121a385828601612158565b9150509250929050565b600080fd5b6000604082840312156121c8576121c76121ad565b5b81905092915050565b6000602082840312156121e7576121e6611df5565b5b600082013567ffffffffffffffff81111561220557612204611dfa565b5b612211848285016121b2565b91505092915050565b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b61225c82611f00565b810181811067ffffffffffffffff8211171561227b5761227a612224565b5b80604052505050565b600061228e611deb565b905061229a8282612253565b919050565b600067ffffffffffffffff8211156122ba576122b9612224565b5b6122c382611f00565b9050602081019050919050565b82818337600083830152505050565b60006122f26122ed8461229f565b612284565b90508281526020810184848401111561230e5761230d61221f565b5b6123198482856122d0565b509392505050565b600082601f8301126123365761233561221a565b5b81356123468482602086016122df565b91505092915050565b6000806000806080858703121561236957612368611df5565b5b600061237787828801612042565b945050602061238887828801612042565b935050604061239987828801611f8d565b925050606085013567ffffffffffffffff8111156123ba576123b9611dfa565b5b6123c687828801612321565b91505092959194509250565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6000819050919050565b600061242361241e61241984611f6c565b6123fe565b611f6c565b9050919050565b61243381612408565b82525050565b6000612445838361242a565b60208301905092915050565b6000602082019050919050565b6000612469826123d2565b61247381856123dd565b935061247e836123ee565b8060005b838110156124af5781516124968882612439565b97506124a183612451565b925050600181019050612482565b5085935050505092915050565b600060208301600083015184820360008601526124d9828261245e565b9150508091505092915050565b6000602082019050818103600083015261250081846124bc565b905092915050565b6000806040838503121561251f5761251e611df5565b5b600061252d85828601612042565b925050602061253e85828601612042565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061258f57607f821691505b6020821081036125a2576125a1612548565b5b50919050565b60006060820190506125bd6000830186612001565b6125ca6020830185612117565b6125d76040830184612001565b949350505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061261982611f6c565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361264b5761264a6125df565b5b600182019050919050565b600080fd5b600080fd5b600067ffffffffffffffff82111561267b5761267a612224565b5b602082029050602081019050919050565b600080fd5b61269a81611f6c565b81146126a557600080fd5b50565b6000813590506126b781612691565b92915050565b60006126d06126cb84612660565b612284565b905080838252602082019050602084028301858111156126f3576126f261268c565b5b835b8181101561271c578061270888826126a8565b8452602084019350506020810190506126f5565b5050509392505050565b600082601f83011261273b5761273a61221a565b5b813561274b8482602086016126bd565b91505092915050565b60006020828403121561276a57612769612656565b5b6127746020612284565b9050600082013567ffffffffffffffff8111156127945761279361265b565b5b6127a084828501612726565b60008301525092915050565b600067ffffffffffffffff8211156127c7576127c6612224565b5b602082029050602081019050919050565b60006127eb6127e6846127ac565b612284565b9050808382526020820190506020840283018581111561280e5761280d61268c565b5b835b8181101561285557803567ffffffffffffffff8111156128335761283261221a565b5b8086016128408982612321565b85526020850194505050602081019050612810565b5050509392505050565b600082601f8301126128745761287361221a565b5b81356128848482602086016127d8565b91505092915050565b6000604082840312156128a3576128a2612656565b5b6128ad6040612284565b9050600082013567ffffffffffffffff8111156128cd576128cc61265b565b5b6128d984828501612754565b600083015250602082013567ffffffffffffffff8111156128fd576128fc61265b565b5b6129098482850161285f565b60208301525092915050565b6000612921368361288d565b9050919050565b600081519050919050565b600082825260208201905092915050565b600061294f82612928565b6129598185612933565b9350612969818560208601611ed6565b61297281611f00565b840191505092915050565b60006080820190506129926000830187612001565b61299f6020830186612001565b6129ac6040830185612117565b81810360608301526129be8184612944565b905095945050505050565b6000815190506129d881611e2b565b92915050565b6000602082840312156129f4576129f3611df5565b5b6000612a02848285016129c9565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b7f4d50435f434f52453a20494e56414c49445f494e5055545f5445585400000000600082015250565b6000612a70601c83611ec5565b9150612a7b82612a3a565b602082019050919050565b60006020820190508181036000830152612a9f81612a63565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b60007fff0000000000000000000000000000000000000000000000000000000000000082169050919050565b612b0a81612ad5565b82525050565b6000604082019050612b256000830185612b01565b612b326020830184612117565b9392505050565b600081519050612b4881611f76565b92915050565b600060208284031215612b6457612b63611df5565b5b6000612b7284828501612b39565b91505092915050565b6000604082019050612b906000830185612001565b612b9d6020830184612117565b9392505050565b6000606082019050612bb96000830186612b01565b612bc66020830185612117565b8181036040830152612bd88184612944565b9050949350505050565b60008160601b9050919050565b6000612bfa82612be2565b9050919050565b6000612c0c82612bef565b9050919050565b612c24612c1f82611fef565b612c01565b82525050565b6000612c368284612c13565b6014820191508190509291505056fea2646970667358221220e87dbd2c2e92207fada58b12cdbe9a717d05c4c78c9368d2e2dc2c8da051f1d664736f6c63430008130033"
        
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
        const provider = getDefaultProvider(CotiNetwork.Testnet);
        const wallet = new Wallet(COTI_MCP_PRIVATE_KEY, provider);
        
        wallet.setAesKey(COTI_MCP_AES_KEY);
        
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
        DEPLOY_PRIVATE_ERC721_CONTRACT,
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