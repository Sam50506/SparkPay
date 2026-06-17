// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract ScheduledPayment {
    IERC20 public usdc;

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

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    function schedule(address recipient, uint256 amount, uint256 releaseTime, string calldata country) external returns (uint256) {
        require(releaseTime > block.timestamp, "Release time must be in future");
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        require(usdc.transferFrom(msg.sender, address(this), amount), "USDC transfer failed");

        uint256 id = paymentCount++;
        payments[id] = Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            releaseTime: releaseTime,
            executed: false,
            cancelled: false,
            country: country
        });

        emit PaymentScheduled(id, msg.sender, recipient, amount, releaseTime);
        return id;
    }

    function execute(uint256 id) external {
        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Payment cancelled");
        require(block.timestamp >= p.releaseTime, "Too early");

        p.executed = true;
        require(usdc.transfer(p.recipient, p.amount), "Transfer failed");

        emit PaymentExecuted(id);
    }

    function cancel(uint256 id) external {
        Payment storage p = payments[id];
        require(msg.sender == p.sender, "Not sender");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");

        p.cancelled = true;
        require(usdc.transfer(p.sender, p.amount), "Refund failed");

        emit PaymentCancelled(id);
    }

    function getPayment(uint256 id) external view returns (Payment memory) {
        return payments[id];
    }

    function getSenderPayments(address sender, uint256 from, uint256 limit) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](limit);
        uint256 count = 0;
        for (uint256 i = from; i < paymentCount && count < limit; i++) {
            if (payments[i].sender == sender) {
                result[count++] = i;
            }
        }
        return result;
    }
}
