// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ScheduledPayment
 * @notice Escrow contract for scheduled native-token payments on Arc Testnet
 * @dev Inherits ReentrancyGuard, Ownable, Pausable from OpenZeppelin
 */
contract ScheduledPayment is ReentrancyGuard, Ownable, Pausable {

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

    // Per-user payment tracking
    mapping(address => uint256[]) public userPayments;

    // Max payments per user to prevent DoS
    uint256 public constant MAX_USER_PAYMENTS = 100;

    // Min release time buffer (1 minute)
    uint256 public constant MIN_RELEASE_BUFFER = 60;

    event PaymentScheduled(
        uint256 indexed id,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 releaseTime,
        string country
    );
    event PaymentExecuted(uint256 indexed id, address recipient, uint256 amount);
    event PaymentCancelled(uint256 indexed id, address sender, uint256 amount);
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    modifier onlyExecutorOrOwner() {
        require(
            msg.sender == executor || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }

    constructor(address initialExecutor) Ownable(msg.sender) {
        require(initialExecutor != address(0), "Invalid executor");
        executor = initialExecutor;
    }

    /**
     * @notice Update the executor address
     * @param _executor New executor address
     */
    function setExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid address");
        emit ExecutorUpdated(executor, _executor);
        executor = _executor;
    }

    /**
     * @notice Schedule a payment to be released at a future time
     * @param recipient Recipient address
     * @param releaseTime Unix timestamp when payment can be executed
     * @param country Destination country code
     */
    function schedule(
        address payable recipient,
        uint256 releaseTime,
        string calldata country
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot send to yourself");
        require(
            releaseTime >= block.timestamp + MIN_RELEASE_BUFFER,
            "Release time too soon"
        );
        require(
            userPayments[msg.sender].length < MAX_USER_PAYMENTS,
            "Too many active payments"
        );

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

        userPayments[msg.sender].push(id);

        emit PaymentScheduled(id, msg.sender, recipient, msg.value, releaseTime, country);
        return id;
    }

    /**
     * @notice Execute a scheduled payment after release time
     * @param id Payment ID
     */
    function execute(uint256 id) external nonReentrant whenNotPaused onlyExecutorOrOwner {
        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Payment cancelled");
        require(block.timestamp >= p.releaseTime, "Too early");

        p.executed = true;

        (bool success, ) = p.recipient.call{value: p.amount}("");
        require(success, "Transfer failed");

        emit PaymentExecuted(id, p.recipient, p.amount);
    }

    /**
     * @notice Cancel a scheduled payment and refund sender
     * @param id Payment ID
     */
    function cancel(uint256 id) external nonReentrant {
        Payment storage p = payments[id];
        require(
            msg.sender == p.sender || msg.sender == executor || msg.sender == owner(),
            "Not authorized"
        );
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require(!p.executed && block.timestamp < p.releaseTime || msg.sender == executor || msg.sender == owner(), "Too late to cancel");

        p.cancelled = true;

        (bool success, ) = payable(p.sender).call{value: p.amount}("");
        require(success, "Refund failed");

        emit PaymentCancelled(id, p.sender, p.amount);
    }

    /**
     * @notice Get payment details by ID
     */
    function getPayment(uint256 id) external view returns (Payment memory) {
        return payments[id];
    }

    /**
     * @notice Get all payment IDs for a user
     */
    function getUserPayments(address user) external view returns (uint256[] memory) {
        return userPayments[user];
    }

    /**
     * @notice Pause the contract (stops new schedules and executions)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdraw stuck funds (only owner)
     * @param to Address to send funds to
     */
    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        emit EmergencyWithdraw(to, balance);
        (bool success, ) = to.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @notice Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}
