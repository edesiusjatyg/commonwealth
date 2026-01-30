// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/BlackWalletFactory.sol";

contract DeployFactory is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        BlackWalletFactory factory = new BlackWalletFactory();

        vm.stopBroadcast();
        
        console.log("BlackWalletFactory deployed at:", address(factory));
    }
}
