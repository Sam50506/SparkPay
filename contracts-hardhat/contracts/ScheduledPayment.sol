// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ScheduledPayment {
    struct Payment {
        address sender;
        address payable recipient;
        uint256 amount;
        uint256 releaseTime;
        bool executed;
        bool cancelled;
        string country;
    }

    address public executor;
    uint256 public paymentCount;
    mapping(uint256 => Payment) public payments;

    event PaymentScheduled(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount, uint256 releaseTime);
    event PaymentExecuted(uint256 indexed id);
    event PaymentCancelled(uint256 indexed id);

    constructor() {
        executor = msg.sender;
    }

    function setExecutor(address _executor) external {
        require(msg.sender == executor, "Not authorized");
        require(_executor != address(0), "Invalid address");
        executor = _executor;
    }

    function schedule(address payable recipient, uint256 releaseTime, string calldata country) external payable returns (uint256) {
        require(releaseTime > block.timestamp, "Release time must be in future");
        require(msg.value > 0, "Amount must be greater than 0");
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
        require(msg.sender == executor, "Not authorized");

        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Payment cancelled");
        require(block.timestamp >= p.releaseTime, "Too early");

        p.executed = true;
        p.recipient.transfer(p.amount);

        emit PaymentExecuted(id);
    }

    function cancel(uint256 id) external {
        Payment storage p = payments[id];
        require(msg.sender == p.sender, "Not sender");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");

        p.cancelled = true;
        payable(p.sender).transfer(p.amount);

        emit PaymentCancelled(id);
    }

    function getPayment(uint256 id) external view returns (Payment memory) {
        return payments[id];
    }
}
