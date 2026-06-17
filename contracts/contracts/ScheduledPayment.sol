// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ScheduledPayment {
    address public owner;

    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        uint256 releaseTime;
        bool executed;
        bool cancelled;
        string country;
    }

    uint256 public paymentCount;
    mapping(uint256 => Payment) public payments;

    event PaymentScheduled(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount, uint256 releaseTime);
    event PaymentExecuted(uint256 indexed id);
    event PaymentCancelled(uint256 indexed id);

    constructor() {
        owner = msg.sender;
    }

    function schedule(
        address recipient,
        uint256 releaseTime,
        string calldata country
    ) external payable returns (uint256) {
        require(msg.value > 0, "Send USDC");
        require(releaseTime > block.timestamp, "Release time must be in future");
        require(recipient != address(0), "Invalid recipient");

        uint256 id = paymentCount++;
        payments[id] = Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            releaseTime: releaseTime,
            executed: false,
            cancelled: false,
            country: country
        });

        emit PaymentScheduled(id, msg.sender, recipient, msg.value, releaseTime);
        return id;
    }

    function execute(uint256 id) external {
        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Cancelled");
        require(block.timestamp >= p.releaseTime, "Too early");

        p.executed = true;
        (bool success,) = payable(p.recipient).call{value: p.amount}("");
        require(success, "Transfer failed");

        emit PaymentExecuted(id);
    }

    function cancel(uint256 id) external {
        Payment storage p = payments[id];
        require(msg.sender == p.sender || msg.sender == owner, "Not authorized");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");

        p.cancelled = true;
        (bool success,) = payable(p.sender).call{value: p.amount}("");
        require(success, "Refund failed");

        emit PaymentCancelled(id);
    }

    function getPayment(uint256 id) external view returns (Payment memory) {
        return payments[id];
    }

    function paymentCount_() external view returns (uint256) {
        return paymentCount;
    }
}
