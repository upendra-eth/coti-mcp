#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { CHANGE_DEFAULT_ACCOUNT, changeDefaultAccountHandler } from './tools/account/changeDefaultAccount.js';
import { CREATE_ACCOUNT, createAccountHandler } from './tools/account/createAccount.js';
import { encryptValueHandler } from "./tools/account/encryptValue.js";
import { decryptValueHandler } from "./tools/account/decryptValue.js";
import { EXPORT_ACCOUNTS, exportAccountsHandler } from "./tools/account/exportAccounts.js";
import { ENCRYPT_VALUE } from "./tools/account/encryptValue.js";
import { DECRYPT_VALUE } from "./tools/account/decryptValue.js";
import { GENERATE_AES_KEY, generateAesKeyHandler } from "./tools/account/generateAesKey.js";
import { IMPORT_ACCOUNTS, importAccountsHandler } from "./tools/account/importAccounts.js";
import { LIST_ACCOUNTS, listAccountsHandler } from "./tools/account/listAccounts.js";
import { SIGN_MESSAGE, signMessageHandler } from "./tools/account/signMessage.js";
import { SWITCH_NETWORK, switchNetworkHandler } from "./tools/account/switchNetwork.js";
import { VERIFY_SIGNATURE, verifySignatureHandler } from "./tools/account/verifySignature.js";
import { MINT_PRIVATE_ERC20_TOKEN, mintPrivateERC20TokenHandler } from "./tools/erc20/mintPrivateErc20Token.js";
import { TRANSFER_PRIVATE_ERC20_TOKEN, transferPrivateERC20TokenHandler } from "./tools/erc20/transferPrivateErc20.js";
import { APPROVE_ERC20_SPENDER, approveERC20SpenderHandler } from "./tools/erc20/approveErc20Spender.js";
import { GET_PRIVATE_ERC20_DECIMALS, getPrivateERC20DecimalsHandler } from "./tools/erc20/getPrivateErc20Decimals.js";
import { GET_PRIVATE_ERC20_TOTAL_SUPPLY, getPrivateERC20TotalSupplyHandler } from "./tools/erc20/getPrivateErc20TotalSupply.js";
import { GET_ERC20_ALLOWANCE, getERC20AllowanceHandler } from "./tools/erc20/getErc20Allowance.js";
import { GET_PRIVATE_ERC20_TOKEN_BALANCE, getPrivateERC20BalanceHandler } from "./tools/erc20/getPrivateErc20Balance.js";
import { DEPLOY_PRIVATE_ERC20_CONTRACT, deployPrivateERC20ContractHandler } from "./tools/erc20/deployPrivateErc20Contract.js";
import { TRANSFER_PRIVATE_ERC721_TOKEN, transferPrivateERC721TokenHandler } from "./tools/erc721/transferPrivateErc721.js";
import { MINT_PRIVATE_ERC721_TOKEN, mintPrivateERC721TokenHandler } from "./tools/erc721/mintPrivateErc721Token.js";
import { SET_PRIVATE_ERC721_APPROVAL_FOR_ALL, setPrivateERC721ApprovalForAllHandler } from "./tools/erc721/setPrivateErc721ApprovalForAll.js";
import { APPROVE_PRIVATE_ERC721, approvePrivateERC721Handler } from "./tools/erc721/approvePrivateErc721.js";
import { DEPLOY_PRIVATE_ERC721_CONTRACT, deployPrivateERC721ContractHandler } from "./tools/erc721/deployPrivateErc721Contract.js";
import { GET_PRIVATE_ERC721_APPROVED, getPrivateERC721ApprovedHandler } from "./tools/erc721/getPrivateErc721Approved.js";
import { GET_PRIVATE_ERC721_BALANCE, getPrivateERC721BalanceHandler } from "./tools/erc721/getPrivateErc721Balance.js";
import { GET_PRIVATE_ERC721_TOKEN_OWNER, getPrivateERC721TokenOwnerHandler } from "./tools/erc721/getPrivateErc721TokenOwner.js";
import { GET_PRIVATE_ERC721_TOKEN_URI, getPrivateERC721TokenURIHandler } from "./tools/erc721/getPrivateErc721TokenUri.js";
import { GET_PRIVATE_ERC721_TOTAL_SUPPLY, getPrivateERC721TotalSupplyHandler } from "./tools/erc721/getPrivateErc721TotalSupply.js";
import { GET_PRIVATE_ERC721_IS_APPROVED_FOR_ALL, getPrivateERC721IsApprovedForAllHandler } from "./tools/erc721/getPrivateErc721IsApprovedForAll.js";
import { GET_TRANSACTION_LOGS, getTransactionLogsHandler } from "./tools/transaction/getTransactionLogs.js";
import { GET_TRANSACTION_STATUS, getTransactionStatusHandler } from "./tools/transaction/getTransactionStatus.js";
import { CALL_CONTRACT_FUNCTION, callContractFunctionHandler } from "./tools/transaction/callContractFunction.js";
import { DECODE_EVENT_DATA, decodeEventDataHandler } from "./tools/transaction/decodeEventData.js";
import { GET_NATIVE_BALANCE, getNativeBalanceHandler } from "./tools/native/getNativeBalance.js";
import { TRANSFER_NATIVE, transferNativeHandler } from "./tools/native/transferNative.js";

export const configSchema = z.object({
  debug: z.boolean().default(false).describe("Enable debug logging"),
  cotiMcpAesKey: z.string().describe("COTI MCP AES key for encrypting values.").optional(),
  cotiMcpPrivateKey: z.string().describe("COTI MCP private key for signing transactions.").optional(),
  cotiMcpPublicKey: z.string().describe("COTI MCP public key that corresponds to the private key.").optional(),
  cotiMcpNetwork: z.string().describe("COTI MCP network to connect to.").optional().default("testnet"),
});

export default function createStatelessServer({
  config,
  sessionId,
}: {
  config: z.infer<typeof configSchema>;
  sessionId: string;
}) {
  const server = new McpServer({
    name: "COTI MCP Server",
    version: "0.1.0",
  });

  // Account Tools

  server.registerTool("change_default_account",
    CHANGE_DEFAULT_ACCOUNT,
    changeDefaultAccountHandler
  );

  server.registerTool("create_account", 
    CREATE_ACCOUNT, 
    createAccountHandler
  );

  server.registerTool("decrypt_value", 
    DECRYPT_VALUE, 
    decryptValueHandler
  );

  server.registerTool("encrypt_value", 
    ENCRYPT_VALUE, 
    encryptValueHandler
  );

  server.registerTool("export_accounts", 
    EXPORT_ACCOUNTS,
    exportAccountsHandler
  );

  server.registerTool("generate_aes_key", 
    GENERATE_AES_KEY,
    generateAesKeyHandler
  );

  server.registerTool("import_accounts", 
    IMPORT_ACCOUNTS,
    importAccountsHandler
  );

  server.registerTool("list_accounts", 
    LIST_ACCOUNTS,
    listAccountsHandler
  );

  server.registerTool("sign_message", 
    SIGN_MESSAGE,
    signMessageHandler
  );

  server.registerTool("switch_network", 
    SWITCH_NETWORK,
    switchNetworkHandler
  );

  server.registerTool("verify_signature", 
    VERIFY_SIGNATURE,
    verifySignatureHandler
  );

  // ERC20 Tools

  server.registerTool("approve_erc20_spender", 
    APPROVE_ERC20_SPENDER,
    approveERC20SpenderHandler
  );

  server.registerTool("deploy_private_erc20_contract", 
    DEPLOY_PRIVATE_ERC20_CONTRACT,
    deployPrivateERC20ContractHandler
  );

  server.registerTool("get_private_erc20_allowance", 
    GET_ERC20_ALLOWANCE,
    getERC20AllowanceHandler
  );

  server.registerTool("get_private_erc20_balance", 
    GET_PRIVATE_ERC20_TOKEN_BALANCE,
    getPrivateERC20BalanceHandler
  );

  server.registerTool("get_private_erc20_decimals", 
    GET_PRIVATE_ERC20_DECIMALS,
    getPrivateERC20DecimalsHandler
  );

  server.registerTool("get_private_erc20_total_supply", 
    GET_PRIVATE_ERC20_TOTAL_SUPPLY,
    getPrivateERC20TotalSupplyHandler
  );

  server.registerTool("mint_private_erc20_token", 
    MINT_PRIVATE_ERC20_TOKEN,
    mintPrivateERC20TokenHandler
  );

  server.registerTool("transfer_private_erc20", 
    TRANSFER_PRIVATE_ERC20_TOKEN,
    transferPrivateERC20TokenHandler
  );


  // ERC721 Tools

  server.registerTool("approve_private_erc721", 
    APPROVE_PRIVATE_ERC721,
    approvePrivateERC721Handler
  );

  server.registerTool("deploy_private_erc721_contract", 
    DEPLOY_PRIVATE_ERC721_CONTRACT,
    deployPrivateERC721ContractHandler
  );

  server.registerTool("get_private_erc721_approved", 
    GET_PRIVATE_ERC721_APPROVED,
    getPrivateERC721ApprovedHandler
  );

  server.registerTool("get_private_erc721_balance", 
    GET_PRIVATE_ERC721_BALANCE,
    getPrivateERC721BalanceHandler
  );

  server.registerTool("get_private_erc721_is_approved_for_all", 
    GET_PRIVATE_ERC721_IS_APPROVED_FOR_ALL,
    getPrivateERC721IsApprovedForAllHandler
  );

  server.registerTool("get_private_erc721_token_owner", 
    GET_PRIVATE_ERC721_TOKEN_OWNER,
    getPrivateERC721TokenOwnerHandler
  );

  server.registerTool("get_private_erc721_token_uri", 
    GET_PRIVATE_ERC721_TOKEN_URI,
    getPrivateERC721TokenURIHandler
  );

  server.registerTool("get_private_erc721_total_supply", 
    GET_PRIVATE_ERC721_TOTAL_SUPPLY,
    getPrivateERC721TotalSupplyHandler
  );

  server.registerTool("mint_private_erc721_token", 
    MINT_PRIVATE_ERC721_TOKEN,
    mintPrivateERC721TokenHandler
  );

  server.registerTool("set_private_erc721_approval_for_all", 
    SET_PRIVATE_ERC721_APPROVAL_FOR_ALL,
    setPrivateERC721ApprovalForAllHandler
  );

  server.registerTool("transfer_private_erc721", 
    TRANSFER_PRIVATE_ERC721_TOKEN,
    transferPrivateERC721TokenHandler
  );

  // Transaction Tools

  server.registerTool("call_contract_function", 
    CALL_CONTRACT_FUNCTION,
    callContractFunctionHandler
  );

  server.registerTool("decode_event_data", 
    DECODE_EVENT_DATA,
    decodeEventDataHandler
  );

  server.registerTool("get_transaction_status", 
    GET_TRANSACTION_STATUS,
    getTransactionStatusHandler
  );

  server.registerTool("get_transaction_logs", 
    GET_TRANSACTION_LOGS,
    getTransactionLogsHandler
  );

  // Native

  server.registerTool("get_native_balance", 
    GET_NATIVE_BALANCE,
    getNativeBalanceHandler
  );

  server.registerTool("transfer_native", 
    TRANSFER_NATIVE,
    transferNativeHandler
  );


  return server.server;
}