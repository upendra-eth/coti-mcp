import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";

export const VERIFY_SIGNATURE: Tool = {
    name: "verify_signature",
    description:
        "Verify a message signature and recover the address that signed it. " +
        "This is used to determine who signed a specific message. " +
        "Requires the original message and the signature as input. " +
        "Returns the address that created the signature.",
    inputSchema: {
        type: "object",
        properties: {
            message: {
                type: "string",
                description: "Original message that was signed",
            },
            signature: {
                type: "string",
                description: "Signature to verify (hexadecimal string)",
            },
        },
        required: ["message", "signature"],
    },
};

/**
 * Checks if the provided arguments are valid for the verify_signature tool.
 * @param args The arguments to check.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isVerifySignatureArgs(args: unknown): args is { message: string, signature: string } {
    return (
        typeof args === "object" &&
        args !== null &&
        "message" in args &&
        typeof (args as { message: string }).message === "string" &&
        "signature" in args &&
        typeof (args as { signature: string }).signature === "string"
    );
}

/**
 * Verifies a message signature and recovers the address that signed it.
 * @param message The original message that was signed.
 * @param signature The signature to verify.
 * @returns The address that created the signature.
 */
export async function performVerifySignature(message: string, signature: string): Promise<string> {
    try {
        // Recover the address from the signature
        const signerAddress = ethers.verifyMessage(message, signature);
        
        return `Message: "${message}"\nSignature: ${signature}\nSigned by address: ${signerAddress}`;
    } catch (error) {
        console.error('Error verifying signature:', error);
        throw new Error(`Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Handler for the verifySignature tool
 * @param args The arguments for the tool
 * @returns The tool response
 */
export async function verifySignatureHandler(args: Record<string, unknown> | undefined) {
    if (!isVerifySignatureArgs(args)) {
        throw new Error("Invalid arguments for verify_signature");
    }
    const { message, signature } = args;

    const results = await performVerifySignature(message, signature);
    return {
        content: [{ type: "text", text: results }],
        isError: false,
    };
}
