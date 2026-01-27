// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract BlackWallet {
    /* ================= EVENTS ================= */
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(bytes32 indexed txHash, address indexed owner, address indexed to, uint256 value, bytes data);
    event ConfirmTransaction(bytes32 indexed txHash, address indexed owner);
    event ExecuteTransaction(bytes32 indexed txHash, address indexed owner);
    event DailyLimitChanged(uint256 newLimit);
    event EmergencyContactChanged(address indexed newContact);

    /* ================= STATE VARIABLES ================= */
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public requiredSignatures;
    
    // Daily Limit State
    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public lastDay; // timestamp of the last reset

    // Emergency
    address public emergencyContact;

    // Transaction Logic
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmCount;
    }

    // mapping from txHash => Transaction
    mapping(bytes32 => Transaction) public transactions;
    // mapping from txHash => owner => confirmed
    mapping(bytes32 => mapping(address => bool)) public confirmations;

    /* ================= MODIFIERS ================= */
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(bytes32 _txHash) {
        require(transactions[_txHash].to != address(0), "Tx does not exist");
        _;
    }

    modifier notExecuted(bytes32 _txHash) {
        require(!transactions[_txHash].executed, "Tx already executed");
        _;
    }

    modifier notConfirmed(bytes32 _txHash) {
        require(!confirmations[_txHash][msg.sender], "Tx already confirmed");
        _;
    }

    /* ================= CONSTRUCTOR ================= */
    constructor(
        address[] memory _owners,
        uint256 _requiredSignatures,
        uint256 _dailyLimit,
        address _emergencyContact
    ) {
        require(_owners.length > 0, "Owners required");
        require(_requiredSignatures > 0 && _requiredSignatures <= _owners.length, "Invalid required signatures");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        requiredSignatures = _requiredSignatures;
        dailyLimit = _dailyLimit;
        emergencyContact = _emergencyContact;
        lastDay = block.timestamp / 1 days;
    }

    /* ================= RECEIVE ================= */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /* ================= TRANSACTIONS ================= */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner returns (bytes32 txHash) {
        // Simple hash generation. In production, prevent replay attacks across chains/contracts properly.
        // using nonce or similar. For this MVP, we use block.timestamp + parameters
        // A better nonce strategy would be `uint256 public nonce`
        txHash = keccak256(abi.encodePacked(address(this), _to, _value, _data, block.timestamp, gasleft()));
        
        transactions[txHash] = Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmCount: 0
        });

        emit SubmitTransaction(txHash, msg.sender, _to, _value, _data);
        confirmTransaction(txHash); // Auto-confirm by submitter
    }

    function confirmTransaction(bytes32 _txHash) public onlyOwner txExists(_txHash) notExecuted(_txHash) notConfirmed(_txHash) {
        confirmations[_txHash][msg.sender] = true;
        transactions[_txHash].confirmCount += 1;

        emit ConfirmTransaction(_txHash, msg.sender);

        executeTransaction(_txHash);
    }

    function executeTransaction(bytes32 _txHash) public onlyOwner txExists(_txHash) notExecuted(_txHash) {
        Transaction storage txn = transactions[_txHash];

        if (txn.confirmCount >= requiredSignatures) {
            // Check Daily Limit if sending value
            if (txn.value > 0) {
                if (isUnderDailyLimit(txn.value)) {
                     updateDailyLimit(txn.value);
                } else {
                    revert("Daily limit exceeded");
                }
            }

            txn.executed = true;
            (bool success, ) = txn.to.call{value: txn.value}(txn.data);
            require(success, "Tx failed");
            
            emit ExecuteTransaction(_txHash, msg.sender);
        }
    }

    /* ================= DAILY LIMIT ================= */
    function isUnderDailyLimit(uint256 _amount) public view returns (bool) {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastDay) {
            return _amount <= dailyLimit;
        }
        return (spentToday + _amount) <= dailyLimit;
    }

    function updateDailyLimit(uint256 _amount) internal {
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastDay) {
            lastDay = currentDay;
            spentToday = _amount;
        } else {
            spentToday += _amount;
        }
    }

    // Emergency Override (Only emergency contact can call this to reset limit or unlock)
    // For MVP: Emergency contact can just reset the spentToday amount allowin txn
    function resetDailySpent() external {
        require(msg.sender == emergencyContact, "Not emergency contact");
        spentToday = 0;
    }

    function setDailyLimit(uint256 _newLimit) external onlyOwner {
         // Requires multi-sig? For simplicity let's say yes, via submitTransaction calling this function.
         require(msg.sender == address(this), "Must go through multi-sig");
         dailyLimit = _newLimit;
         emit DailyLimitChanged(_newLimit);
    }
}
