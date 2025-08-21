import { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys, getNetwork } from "../shared/account.js";
import { getDefaultProvider, Wallet } from "@coti-io/coti-ethers";
import { z } from "zod";

export const SIGN_MESSAGE: ToolAnnotations = {
    title: "Sign Message",
    name: "sign_message",
    description:
        "Sign a message using the COTI private key. " +
        "This creates a cryptographic signature that proves the message was signed by the owner of the private key. " +
        "Requires a message to sign as input. " +
        "Returns the signature.",
    inputSchema: {
        message: z.string().describe("Message to sign"),
    }
};

/**
 * Checks if the provided arguments are valid for the sign_message tool.
 * @param args The arguments to check.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isSignMessageArgs(args: unknown): args is { message: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "message" in args &&
        typeof (args as { message: string }).message === "string"
    );
}

/**
 * Signs a message using the COTI private key.
 * @param message The message to sign.
 * @returns The signature.
 */
export async function performSignMessage(message: string): Promise<string> {
    try {
        const currentAccountKeys = getCurrentAccountKeys();
        const provider = getDefaultProvider(getNetwork());
        const wallet = new Wallet(currentAccountKeys.privateKey, provider);
        
        // Sign the message
        const signature = await wallet.signMessage(message);
        
        return `Message: "${message}"\nSignature: ${signature}`;
    } catch (error) {
        console.error('Error signing message:', error);
        throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the signMessage tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function signMessageHandler(args: Record<string, unknown> | undefined): Promise<any> {
    if (!isSignMessageArgs(args)) {
        throw new Error("Invalid arguments for sign_message");
    }
    const { message } = args;

    const results = await performSignMessage(message);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}
