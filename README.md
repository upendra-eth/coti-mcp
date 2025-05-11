# <img src="https://coti.io/favicon.ico" height="32"> COTI Blockchain MCP

The COTI Blockchain MCP integrates COTI blockchain access into Claude AI and other apps. This MCP allows you to:
- Check native COTI token balances on the COTI blockchain using the official @coti-io/coti-ethers library
- View formatted balance information in a user-friendly format

## Available Tools

### get_native_balance

**Description:**  
Get the native COTI token balance of a COTI blockchain account using the official @coti-io/coti-ethers library. This is used for checking the current native token balance of a COTI account. Returns the account balance in both raw (Wei) and formatted (COTI) units.

**Input Parameters:**
- `account_address` (required): COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273

### get_private_erc20_balance

**Description:**  
Get the balance of a private ERC20 token on the COTI blockchain using the official @coti-io/coti-ethers library. This is used for checking the current balance of a private ERC20 token on the COTI blockchain. Returns the token balance in both raw (Wei) and formatted (COTI) units.

**Input Parameters:**
- `account_address` (required): COTI account address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273
- `token_address` (required): ERC20 token address, e.g., 0x1234567890abcdef1234567890abcdef12345678


### transfer_native

**Description:**
Transfer native COTI tokens to another wallet using the official @coti-io/coti-ethers library. This is used for sending COTI tokens from your wallet to another address. Returns the transaction hash upon successful transfer.

**Input Parameters:**
- `recipient_address` (required): Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273
- `amount_wei` (required): Amount of COTI to transfer (in Wei)
- `gas_limit` (optional): Optional gas limit for the transaction

### transfer_private_erc20

**Description:**
Transfer private ERC20 tokens on the COTI blockchain using the official @coti-io/coti-ethers library. This is used for sending private tokens from your wallet to another address. Returns the transaction hash upon successful transfer.

**Input Parameters:**
- `token_address` (required): ERC20 token contract address on COTI blockchain
- `recipient_address` (required): Recipient COTI address, e.g., 0x0D7C5C1DA069fd7C1fAFBeb922482B2C7B15D273
- `amount_wei` (required): Amount of tokens to transfer (in Wei)
- `gas_limit` (optional): Optional gas limit for the transaction

### encrypt_value

**Description:**
Encrypt a value using the COTI AES key. This is used for encrypting values to be sent to another address. Returns the signature.

**Input Parameters:**
- `message` (required): Message to encrypt
- `contract_address` (required): Contract address
- `function_selector` (required): Function selector

### decrypt_value

**Description:**
Decrypt a value using the COTI AES key. Requires a ciphertext as input. Returns the decrypted value.

**Input Parameters:**
- `ciphertext` (required): Ciphertext to decrypt

## Requirements

For this COTI Blockchain MCP, you need:
- NodeJS v18 or higher (https://nodejs.org/)
- Git (https://git-scm.com/)
- COTI AES Key for API authentication
- COTI Private Key for signing transactions
- COTI Public Key that corresponds to the private key

## Setup

1. Clone the repository
```
git clone https://github.com/yourusername/coti-mcp.git
```

2. Install dependencies
```
npm install
```

3. Build project
```
npm run build
```

This creates the file `build\index.js`

## Using in Claude AI

Add the following entry to `mcpServers`:

```
"coti-mcp": {
    "command": "node",
    "args": [
      "path\\build\\index.js"
    ],
    "env": {
      "COTI_MCP_AES_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "COTI_MCP_PUBLIC_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "COTI_MCP_PRIVATE_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
    }
}
```

and replace `path` with the path to COTI MCP and `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` with your COTI AES Key

so that `mcpServers` will look like this:

```
{
  "mcpServers": {
    "coti-mcp": {
      "command": "node",
      "args": [
        "path\\build\\index.js"
      ],
      "env": {
        "COTI_MCP_AES_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "COTI_MCP_PUBLIC_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "COTI_MCP_PRIVATE_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```
