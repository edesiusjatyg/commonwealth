import { createPublicClient, createWalletClient, http, parseEther, Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';

// Load env vars
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as Address;
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

if (!FACTORY_ADDRESS) {
    console.warn("Missing FACTORY_ADDRESS env var");
}

if (!RELAYER_PRIVATE_KEY) {
    console.warn("Missing RELAYER_PRIVATE_KEY env var");
}

if (!RPC_URL) {
    console.warn("Missing RPC_URL env var");
}

const account = privateKeyToAccount(RELAYER_PRIVATE_KEY);

export const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(RPC_URL)
});

export const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
});

// ABI for BlackWalletFactory
// ABI for BlackWalletFactory
export const FACTORY_ABI = [
    {
        "type": "function",
        "name": "createWallet",
        "inputs": [
            { "name": "_owners", "type": "address[]", "internalType": "address[]" },
            { "name": "_requiredSignatures", "type": "uint256", "internalType": "uint256" },
            { "name": "_dailyLimit", "type": "uint256", "internalType": "uint256" },
            { "name": "_emergencyContacts", "type": "address[]", "internalType": "address[]" },
            { "name": "_salt", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [{ "name": "wallet", "type": "address", "internalType": "address" }],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "computeAddress",
        "inputs": [
            { "name": "_owners", "type": "address[]", "internalType": "address[]" },
            { "name": "_requiredSignatures", "type": "uint256", "internalType": "uint256" },
            { "name": "_dailyLimit", "type": "uint256", "internalType": "uint256" },
            { "name": "_emergencyContacts", "type": "address[]", "internalType": "address[]" },
            { "name": "_salt", "type": "uint256", "internalType": "uint256" },
            { "name": "_deployer", "type": "address", "internalType": "address" }
        ],
        "outputs": [{ "name": "wallet", "type": "address", "internalType": "address" }],
        "stateMutability": "view"
    }
] as const;

export async function deployWalletOnChain(
    owners: Address[],
    requiredSignatures: bigint,
    dailyLimit: bigint,
    emergencyContacts: Address[],
    salt: bigint
): Promise<string> {
    try {
        const hash = await walletClient.writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createWallet',
            args: [owners, requiredSignatures, dailyLimit, emergencyContacts, salt]
        });

        console.log(`Transaction sent: ${hash}. Waiting for confirmation...`);

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1
        });

        if (receipt.status !== 'success') {
            throw new Error(`Transaction failed with status: ${receipt.status}`);
        }

        console.log(`Transaction confirmed: ${hash}`);

        return hash;
    } catch (e) {
        console.error("Chain deployment failed", e);
        throw e;
    }
}

export function generateAccount() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return {
        privateKey,
        address: account.address
    };
}

export async function computeWalletAddress(
    owners: Address[],
    requiredSignatures: bigint,
    dailyLimit: bigint,
    emergencyContacts: Address[],
    salt: bigint
): Promise<string> {
    const address = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'computeAddress',
        args: [owners, requiredSignatures, dailyLimit, emergencyContacts, salt, account.address]
    });
    return address;
}


