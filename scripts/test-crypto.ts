
import { encrypt, decrypt } from '../lib/crypto';

// Use the key we know is in .env for testing, or assume .env is loaded
// Since we run with `next` or `tsx` which might load .env, or we manually set it.
// We will rely on lib/crypto reading process.env.

const TEST_KEY = "0f452edea0fa92d72ac96c8aac8090fb368f939fc9009d1026803789333103c2";
process.env.ENCRYPTION_KEY = TEST_KEY;

function main() {
    console.log("Testing Crypto Lib...");
    const originalText = "super_secret_private_key_12345";

    try {
        console.log("Original:", originalText);
        const encrypted = encrypt(originalText);
        console.log("Encrypted:", encrypted);

        const decrypted = decrypt(encrypted);
        console.log("Decrypted:", decrypted);

        if (originalText === decrypted) {
            console.log("SUCCESS: Decryption matches original.");
        } else {
            console.error("FAILURE: Decryption mismatch.");
            process.exit(1);
        }
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

main();
