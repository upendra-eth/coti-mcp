# <img src="https://coti.io/favicon.ico" height="32"> COTI Blockchain MCP

The COTI Blockchain MCP integrates COTI blockchain access into Claude AI and other apps. This MCP allows you to:
- Check native COTI token balances on the COTI blockchain using the official @coti-io/coti-ethers library
- View formatted balance information in a user-friendly format

## Available Tools

### coti_get_native_balance

**Description:**  
Get the native COTI token balance of a COTI blockchain account using the official @coti-io/coti-ethers library. This is used for checking the current native token balance of a COTI account. Returns the account balance in both raw (Wei) and formatted (COTI) units.

**Input Parameters:**
- `account_address` (required): COTI account address, e.g., coti1abcdef1234567890abcdef1234567890abcdef

### coti_get_private_erc20_token_balance

**Description:**  
Get the balance of a private ERC20 token on the COTI blockchain using the official @coti-io/coti-ethers library. This is used for checking the current balance of a private ERC20 token on the COTI blockchain. Returns the token balance in both raw (Wei) and formatted (COTI) units.

**Input Parameters:**
- `account_address` (required): COTI account address, e.g., coti1abcdef1234567890abcdef1234567890abcdef
- `token_address` (required): ERC20 token address, e.g., 0x1234567890abcdef1234567890abcdef12345678

## Requirements

For this COTI Blockchain MCP, you need:
- NodeJS v18 or higher (https://nodejs.org/)
- Git (https://git-scm.com/)
- COTI AES Key for API authentication

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
        "COTI_MCP_PRIVATE_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```
