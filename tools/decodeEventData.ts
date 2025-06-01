import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentAccountKeys } from "./shared/account.js";
import { getDefaultProvider, Wallet, ethers, CotiNetwork } from "@coti-io/coti-ethers";
import { ERC20_ABI, ERC721_ABI } from "./constants/abis.js";

export const DECODE_EVENT_DATA: Tool = {
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

/**
 * Checks if the provided arguments are valid for the decode_event_data tool.
 * @param args The arguments to check.
 * @returns True if the arguments are valid, false otherwise.
 */
export function isDecodeEventDataArgs(args: unknown): args is { topics: string[]; data: string; abi?: string } {
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

/**
 * Decodes event data from a transaction log based on the event signature.
 * @param topics Array of topics from the transaction log.
 * @param data Data field from the transaction log.
 * @param abi Optional JSON string representation of the contract ABI. If not provided, will attempt to use standard ERC20/ERC721 ABIs.
 * @returns The decoded event data.
 */
export async function performDecodeEventData(topics: string[], data: string, abi?: string): Promise<string> {
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