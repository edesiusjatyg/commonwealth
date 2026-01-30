// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BlackWallet.sol";
import "../src/BlackWalletFactory.sol";

contract WalletIntegrationTest is Test {
    BlackWalletFactory public factory;
    BlackWallet public wallet;

    function setUp() public {
        factory = new BlackWalletFactory();
    }

    function testFullLifecycle() public {
        // 1. Prepare args
        address[] memory owners = new address[](1);
        owners[0] = address(0x111);
        
        address[] memory contacts = new address[](2);
        contacts[0] = address(0x222);
        contacts[1] = address(0x333);
        
        uint256 salt = 12345;
        
        // 2. Predict Address
        address predicted = factory.computeAddress(
            owners, 
            1, 
            1000 ether, 
            contacts, 
            salt, 
            address(this)
        );
        
        // 3. Create Wallet
        address created = factory.createWallet(
            owners, 
            1, 
            1000 ether, 
            contacts, 
            salt
        );
        
        assertEq(predicted, created, "Predicted address mismatch");
        
        wallet = BlackWallet(payable(created));
        
        // 4. Verify Config
        assertTrue(wallet.isOwner(address(0x111)));
        assertFalse(wallet.isOwner(address(0x222)));
        
        assertTrue(wallet.isEmergencyContact(address(0x222)));
        assertTrue(wallet.isEmergencyContact(address(0x333)));
        
        // 5. Test Usage (Fund and Reset)
        vm.deal(address(wallet), 10 ether);
        
        // Simulate spend (requires tx)
        vm.prank(address(0x111));
        bytes32 txHash = wallet.submitTransaction(address(0x999), 1 ether, "");
        // Auto-confirmed by single owner
        
        assertEq(wallet.spentToday(), 1 ether);
        
        // Reset by contact 2
        vm.prank(address(0x333));
        wallet.resetDailySpent();
        assertEq(wallet.spentToday(), 0);
    }
}
