
import { createPublicClient, http, Address } from 'viem';
import { baseSepolia } from 'viem/chains';
import { FACTORY_ABI, publicClient } from '../app/server/chain';

const FACTORY_ADDRESS = "0x6f7b197be3575b44e7c34dcb10bac8a1b6f4b824" as Address;

async function main() {
    console.log("Verifying computeAddress on factory:", FACTORY_ADDRESS);

    // Mock data based on wallet.ts usage
    const owners: Address[] = ["0x38a047de65f3b49eec7671ca9ce7928f4774e61d"]; // Replace with valid address if needed
    const requiredSignatures = BigInt(1);
    const dailyLimit = BigInt(0);
    const emergencyContacts: Address[] = ["0x38a047de65f3b49eec7671ca9ce7928f4774e61d"];
    const salt = BigInt(12345);
    const deployer = FACTORY_ADDRESS; // In wallet.ts, chain.ts passes FACTORY_ADDRESS as deployer? No wait.

    // In chain.ts:
    // args: [owners, requiredSignatures, dailyLimit, emergencyContacts, salt, FACTORY_ADDRESS]
    // The last arg in solidity is `address _deployer`.
    // Wait, why did chain.ts pass FACTORY_ADDRESS as deployer? 
    // computeAddress implementation in Solidity:
    // bytes32 salt = keccak256(abi.encodePacked(_deployer, _salt));
    // The createWallet function:
    // bytes32 salt = keccak256(abi.encodePacked(msg.sender, _salt));
    // So `_deployer` should be the `msg.sender` of `createWallet`.
    // In `deployWalletOnChain` (chain.ts), `walletClient.writeContract` is used.
    // The account used is `walletClient.account`.

    // Let's check chain.ts again.

    try {
        const address = await publicClient.readContract({
            address: FACTORY_ADDRESS,
            abi: FACTORY_ABI,
            functionName: 'computeAddress',
            args: [owners, requiredSignatures, dailyLimit, emergencyContacts, salt, "0x38a047de65f3b49eec7671ca9ce7928f4774e61d"]
        });
        console.log("Success! Computed Address:", address);
    } catch (e) {
        console.error("Error computing address:", e);
    }
}

main();
