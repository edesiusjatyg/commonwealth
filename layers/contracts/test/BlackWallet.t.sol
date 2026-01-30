// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BlackWallet.sol";

contract BlackWalletTest is Test {
    BlackWallet public wallet;
    address[] public owners;
    address[] public emergencyContacts;
    
    address owner1 = address(0x1);
    address owner2 = address(0x2);
    address contact1 = address(0x3);
    address contact2 = address(0x4);
    address nonContact = address(0x5);

    function setUp() public {
        owners.push(owner1);
        owners.push(owner2);
        
        emergencyContacts.push(contact1);
        emergencyContacts.push(contact2);

        wallet = new BlackWallet(owners, 2, 1000 ether, emergencyContacts);
        
        // Fund the wallet
        vm.deal(address(wallet), 1000 ether);
    }

    function testInitialState() public {
        assertEq(wallet.owners(0), owner1);
        assertEq(wallet.owners(1), owner2);
        assertTrue(wallet.isOwner(owner1));
        
        assertEq(wallet.emergencyContacts(0), contact1);
        assertEq(wallet.emergencyContacts(1), contact2);
        assertTrue(wallet.isEmergencyContact(contact1));
        assertTrue(wallet.isEmergencyContact(contact2));
    }

    function testDailyLimitSpending() public {
        // Owner 1 submits tx to send 0.5 eth
        vm.prank(owner1);
        bytes32 txHash = wallet.submitTransaction(address(0x99), 0.5 ether, "");
        
        // Owner 2 confirms
        vm.prank(owner2);
        wallet.confirmTransaction(txHash);

        // Should succeed as it's under limit (1000)
        assertEq(address(0x99).balance, 0.5 ether);
        assertEq(wallet.spentToday(), 0.5 ether);
    }

    function testEmergencyReset() public {
        // Artificially inflate spentToday
        // We simulate spending until full via real transactions.
        
        // 1. Spend valid amount
        vm.prank(owner1);
        bytes32 txHash = wallet.submitTransaction(address(0x99), 100 ether, "");
        vm.prank(owner2);
        wallet.confirmTransaction(txHash);
        
        assertEq(wallet.spentToday(), 100 ether);
        
        // 2. Emergency Contact 1 resets
        vm.prank(contact1);
        wallet.resetDailySpent();
        assertEq(wallet.spentToday(), 0);
        
        // 3. Spend again
        vm.warp(block.timestamp + 100);
        vm.prank(owner1);
        txHash = wallet.submitTransaction(address(0x99), 100 ether, "");
        vm.prank(owner2);
        wallet.confirmTransaction(txHash);
        assertEq(wallet.spentToday(), 100 ether);

        // 4. Emergency Contact 2 resets
        vm.prank(contact2);
        wallet.resetDailySpent();
        assertEq(wallet.spentToday(), 0);
    }

    function testUnauthorizedReset() public {
        vm.prank(nonContact);
        vm.expectRevert("Not emergency contact");
        wallet.resetDailySpent();
    }
}
