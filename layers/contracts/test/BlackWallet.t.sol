// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/BlackWallet.sol";
import "../src/BlackWalletFactory.sol";

contract BlackWalletTest is Test {
    BlackWalletFactory public factory;
    BlackWallet public wallet;

    address public owner1 = address(0x1);
    address public owner2 = address(0x2);
    address public owner3 = address(0x3);
    address[] public owners;

    address public emergency = address(0x9);
    
    function setUp() public {
        factory = new BlackWalletFactory();
        
        owners.push(owner1);
        owners.push(owner2);
        owners.push(owner3);

        address walletAddr = factory.createWallet(
            owners,
            2, // Required signatures
            1 ether, // Daily Limit
            emergency,
            123 // Salt
        );
        
        wallet = BlackWallet(payable(walletAddr));
        
        vm.deal(address(wallet), 10 ether);
    }

    function testInitialState() public {
        assertEq(wallet.requiredSignatures(), 2);
        assertEq(wallet.dailyLimit(), 1 ether);
        assertTrue(wallet.isOwner(owner1));
        assertTrue(wallet.isOwner(owner2));
        assertEq(wallet.emergencyContact(), emergency);
    }

    function testDeposit() public {
        vm.deal(address(this), 1 ether);
        (bool success, ) = address(wallet).call{value: 1 ether}("");
        assertTrue(success);
        assertEq(address(wallet).balance, 11 ether); // 10 initial + 1
    }

    function testSubmitAndConfirmTransaction() public {
        vm.startPrank(owner1);
        address recipient = address(0xABC);
        bytes memory data = "";
        
        bytes32 txHash = wallet.submitTransaction(recipient, 0.5 ether, data);
        
        (,,,, uint256 confirmCount) = wallet.transactions(txHash);
        assertEq(confirmCount, 1); // Auto-confirmed by submitter
        vm.stopPrank();

        vm.startPrank(owner2);
        wallet.confirmTransaction(txHash);
        
        (,,, bool executed, uint256 newCount) = wallet.transactions(txHash);
        assertEq(newCount, 2);
        assertTrue(executed);
        
        // Check recipient balance (assuming recipient was 0)
        assertEq(recipient.balance, 0.5 ether);
        vm.stopPrank();
    }

    function testDailyLimitLimit() public {
        // Daily Limit is 1 ETH
        // Send 0.9 ETH - Should pass
        
        // 1. First TX (0.9 ETH)
        address recipient = address(0x123456);
        vm.startPrank(owner1);
        bytes32 tx1 = wallet.submitTransaction(recipient, 0.9 ether, "");
        vm.stopPrank();
        
        vm.startPrank(owner2);
        wallet.confirmTransaction(tx1);
        vm.stopPrank();
        
        assertEq(wallet.spentToday(), 0.9 ether);
        
        // 2. Second TX (0.2 ETH) - Should Fail due to limit (Total 1.1)
        vm.startPrank(owner1);
        bytes32 tx2 = wallet.submitTransaction(recipient, 0.2 ether, "");
        vm.stopPrank();
        
        vm.startPrank(owner2);
        vm.expectRevert("Daily limit exceeded");
        wallet.confirmTransaction(tx2);
        vm.stopPrank();
    }

    function testDailyLimitResetNextDay() public {
        address recipient = address(0x234567);
        // Spend 1 ETH today
        vm.startPrank(owner1);
        bytes32 tx1 = wallet.submitTransaction(recipient, 1 ether, "");
        vm.stopPrank();
        vm.prank(owner2);
        wallet.confirmTransaction(tx1);
        
        assertEq(wallet.spentToday(), 1 ether);
        
        // Warps 1 day + 1 second
        vm.warp(block.timestamp + 1 days + 1);
        
        // Spend 0.5 ETH - Should Pass (New Day)
        vm.startPrank(owner1);
        bytes32 tx2 = wallet.submitTransaction(recipient, 0.5 ether, "");
        vm.stopPrank();
        vm.prank(owner2);
        wallet.confirmTransaction(tx2);
        
        assertEq(wallet.spentToday(), 0.5 ether);
    }
    
    function testEmergencyReset() public {
        address recipient = address(0x345678);
        // Spend 1 ETH (Max)
        vm.startPrank(owner1);
        bytes32 tx1 = wallet.submitTransaction(recipient, 1 ether, "");
        vm.stopPrank();
        vm.prank(owner2);
        wallet.confirmTransaction(tx1);
        
        // Try more - Fail
        vm.startPrank(owner1);
        bytes32 tx2 = wallet.submitTransaction(recipient, 0.1 ether, "");
        vm.stopPrank();
        vm.startPrank(owner2);
        vm.expectRevert("Daily limit exceeded");
        wallet.confirmTransaction(tx2);
        vm.stopPrank();
        
        // Emergency Call
        vm.prank(emergency);
        wallet.resetDailySpent();
        assertEq(wallet.spentToday(), 0);
        
        // Retry tx2 confirm - Should Pass now
        vm.prank(owner2);
        wallet.confirmTransaction(tx2);
    }
}
