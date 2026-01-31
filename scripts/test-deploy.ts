
import { Address } from 'viem';
import { deployWalletOnChain, computeWalletAddress, publicClient } from '../app/server/chain';

async function main() {
    console.log("Starting real deployment test...");

    // Setup test data
    const owners: Address[] = ["0x38a047de65f3b49eec7671ca9ce7928f4774e61d"];
    const requiredSignatures = BigInt(1);
    const dailyLimit = BigInt(0);
    const emergencyContacts: Address[] = ["0x38a047de65f3b49eec7671ca9ce7928f4774e61d"];
    const salt = BigInt(Math.floor(Math.random() * 1000000)); // Random salt to ensure new deployment

    try {
        // 1. Compute expected address
        console.log("Computing address...");
        const computedAddress = await computeWalletAddress(
            owners,
            requiredSignatures,
            dailyLimit,
            emergencyContacts,
            salt
        );
        console.log("Computed Address:", computedAddress);

        // 2. Deploy
        console.log("Deploying wallet...");
        const txHash = await deployWalletOnChain(
            owners,
            requiredSignatures,
            dailyLimit,
            emergencyContacts,
            salt
        );
        console.log("Deployment confirmed. Tx Hash:", txHash);

        // 3. Verify Code exists
        console.log("Verifying code at computed address...");
        const code = await publicClient.getBytecode({ address: computedAddress as Address });

        if (code && code !== '0x') {
            console.log("SUCCESS: Contract code found at", computedAddress);
            console.log("Code size:", code.length);
        } else {
            console.error("FAILURE: No code found at", computedAddress);
            process.exit(1);
        }

    } catch (e) {
        console.error("Error during test:", e);
        process.exit(1);
    }
}

main();
