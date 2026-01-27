// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./BlackWallet.sol";

contract BlackWalletFactory {
    event WalletCreated(address indexed wallet, address[] owners, uint256 requiredSignatures);

    function createWallet(
        address[] memory _owners,
        uint256 _requiredSignatures,
        uint256 _dailyLimit,
        address _emergencyContact,
        uint256 _salt
    ) external returns (address wallet) {
        bytes memory bytecode = abi.encodePacked(
            type(BlackWallet).creationCode,
            abi.encode(_owners, _requiredSignatures, _dailyLimit, _emergencyContact)
        );

        bytes32 salt = keccak256(abi.encodePacked(msg.sender, _salt));

        assembly {
            wallet := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(wallet != address(0), "Create2 failed");

        emit WalletCreated(wallet, _owners, _requiredSignatures);
    }
    
    function computeAddress(
        address[] memory _owners,
        uint256 _requiredSignatures,
        uint256 _dailyLimit,
        address _emergencyContact,
        uint256 _salt,
        address _deployer
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(BlackWallet).creationCode,
            abi.encode(_owners, _requiredSignatures, _dailyLimit, _emergencyContact)
        );

        bytes32 salt = keccak256(abi.encodePacked(_deployer, _salt));
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}
