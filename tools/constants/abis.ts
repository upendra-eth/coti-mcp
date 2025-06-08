export const ERC20_ABI = [
  // Constructor
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string"
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string"
      },
      {
        internalType: "uint8",
        name: "decimals_",
        type: "uint8"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  // Name
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },

  // Symbol
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },

  // Decimals
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },

  // Total Supply
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },

  // Balance of
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "ctUint64",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
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

  // Transfer event
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "ctUint64",
        name: "senderValue",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "ctUint64",
        name: "receiverValue",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  },

  // Approval event
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        indexed: false,
        internalType: "ctUint64",
        name: "ownerValue",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "ctUint64",
        name: "spenderValue",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
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

  // Account Encryption Address
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accountEncryptionAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },

  // Reencrypt Allowance
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

  // Set Account Encryption Address
  {
    inputs: [{ name: "offBoardAddress", type: "address" }],
    name: "setAccountEncryptionAddress",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },

  // Mint
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        internalType: "uint64",
        name: "amount",
        type: "uint64"
      }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },

  // Total Supply
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },

  // Allowance (owner, spender)
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
  }
];

export const ERC721_ABI = [
    // Constructor
    {
        inputs: [
          {
            internalType: "string",
            name: "name_",
            type: "string"
          },
          {
            internalType: "string",
            name: "symbol_",
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
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
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
    constant: false,
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ],
    name: "approve",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    type: "function"
  },
  {
    constant: false,
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" }
    ],
    name: "setApprovalForAll",
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    constant: true,
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" }
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
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
},
// mint function
{
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        components: [
          {
            components: [
              {
                internalType: "ctUint64[]",
                name: "value",
                type: "uint256[]"
              }
            ],
            internalType: "struct ctString",
            name: "ciphertext",
            type: "tuple"
          },
          {
            internalType: "bytes[]",
            name: "signature",
            type: "bytes[]"
          }
        ],
        internalType: "struct itString",
        name: "itTokenURI",
        type: "tuple"
      }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
},
// ownerOf function
{
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256"
      }
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
},
// totalSupply function
{
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
},
// events
{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
        },
        {
            indexed: true,
            internalType: "address",
            name: "approved",
            type: "address"
        },
        {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256"
        }
    ],
    name: "Approval",
    type: "event"
},
{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
        },
        {
            indexed: true,
            internalType: "address",
            name: "operator",
            type: "address"
        },
        {
            indexed: false,
            internalType: "bool",
            name: "approved",
            type: "bool"
        }
    ],
    name: "ApprovalForAll",
    type: "event"
},
{
    anonymous: false,
    inputs: [
        {
            indexed: false,
            internalType: "uint256",
            name: "_fromTokenId",
            type: "uint256"
        },
        {
            indexed: false,
            internalType: "uint256",
            name: "_toTokenId",
            type: "uint256"
        }
    ],
    name: "BatchMetadataUpdate",
    type: "event"
},
{
    anonymous: false,
    inputs: [
        {
            indexed: false,
            internalType: "uint256",
            name: "_tokenId",
            type: "uint256"
        }
    ],
    name: "MetadataUpdate",
    type: "event"
},
{
    anonymous: false,
    inputs: [
        {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address"
        },
        {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address"
        },
        {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256"
        }
    ],
    name: "Transfer",
    type: "event"
},
];