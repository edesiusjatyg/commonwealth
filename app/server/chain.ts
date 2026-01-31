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
const RELAYER_ADDRESS = account.address;

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
    console.info("[chain.deployWalletOnChain] Deploying wallet on-chain", { 
        ownersCount: owners.length,
        requiredSignatures: requiredSignatures.toString(),
        dailyLimit: dailyLimit.toString(),
        salt: salt.toString()
    });
    
    try {
        const hash = await walletClient.writeContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'createWallet',
            args: [owners, requiredSignatures, dailyLimit, [RELAYER_ADDRESS], salt]
        });

        console.info("[chain.deployWalletOnChain] Transaction sent", { hash });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: 1
        });

        if (receipt.status !== 'success') {
            console.error("[chain.deployWalletOnChain] Transaction failed", { 
                hash, 
                status: receipt.status 
            });
            throw new Error(`Transaction failed with status: ${receipt.status}`);
        }

        console.info("[chain.deployWalletOnChain] Transaction confirmed", { hash });

        return hash;
    } catch (e) {
        console.error("[chain.deployWalletOnChain] Chain deployment failed:", e);
        throw e;
    }
}

export async function resetDailyLimitOnChain(walletAddress: string): Promise<string> {
    console.info("[chain.resetDailyLimitOnChain] Resetting daily limit on-chain", { 
        walletAddress 
    });
    
    try {
        const hash = await walletClient.writeContract({
            address: walletAddress as Address,
            abi: [
                {
                    "type": "function",
                    "name": "resetDailySpent",
                    "inputs": [],
                    "outputs": [],
                    "stateMutability": "nonpayable"
                }
            ],
            functionName: 'resetDailySpent',
            args: []
        });

        console.info("[chain.resetDailyLimitOnChain] Reset daily limit tx sent", { hash });

        await publicClient.waitForTransactionReceipt({ hash });
        
        console.info("[chain.resetDailyLimitOnChain] Transaction confirmed", { hash });

        return hash;
    } catch (e) {
        console.error("[chain.resetDailyLimitOnChain] Failed to reset daily limit on chain:", e);
        throw e;
    }
}

export function generateAccount() {
    console.info("[chain.generateAccount] Generating new account");
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    console.info("[chain.generateAccount] Account generated", { address: account.address });
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
    console.info("[chain.computeWalletAddress] Computing wallet address", { 
        ownersCount: owners.length,
        salt: salt.toString()
    });
    
    const address = await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'computeAddress',
        args: [owners, requiredSignatures, dailyLimit, [RELAYER_ADDRESS], salt, account.address]
    });
    
    console.info("[chain.computeWalletAddress] Address computed", { address });
    return address;
}


