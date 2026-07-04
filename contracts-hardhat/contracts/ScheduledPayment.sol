// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

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
    mapping(address => uint256[]) public userPayments;

    uint256 public constant MAX_USER_PAYMENTS = 100;
    uint256 public constant MIN_RELEASE_BUFFER = 60;

    event PaymentScheduled(uint256 indexed id, address indexed sender, address indexed recipient, uint256 amount, uint256 releaseTime, string country);
    event PaymentExecuted(uint256 indexed id, address recipient, uint256 amount);
    // Adjusted PaymentCancelled to match tests (id, sender, amount)
    event PaymentCancelled(uint256 indexed id, address sender, uint256 amount);
    event PaymentEdited(uint256 indexed id, address recipient, uint256 amount, uint256 releaseTime);
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    modifier onlyExecutorOrOwner() {
        require(msg.sender == executor || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address initialExecutor) Ownable(msg.sender) {
        require(initialExecutor != address(0), "Invalid executor");
        executor = initialExecutor;
    }

    function setExecutor(address _executor) external onlyOwner {
        require(_executor != address(0), "Invalid address");
        emit ExecutorUpdated(executor, _executor);
        executor = _executor;
    }

    function schedule(
        address payable recipient,
        uint256 releaseTime,
        string calldata country
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        require(recipient != msg.sender, "Cannot send to yourself");
        require(releaseTime >= block.timestamp + MIN_RELEASE_BUFFER, "Release time too soon");
        require(userPayments[msg.sender].length < MAX_USER_PAYMENTS, "Too many active payments");

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
     * @notice Edit a scheduled payment before release time (user only)
     * @dev Send more ETH to increase amount, excess refunded if sending less is not possible
     * @param id Payment ID
     * @param newRecipient New recipient (address(0) to keep current)
     * @param newReleaseTime New release time (0 to keep current)
     * @param newCountry New country (empty to keep current)
     */
    function edit(
        uint256 id,
        address payable newRecipient,
        uint256 newReleaseTime,
        string calldata newCountry
    ) external payable nonReentrant whenNotPaused {
        Payment storage p = payments[id];
        require(msg.sender == p.sender, "Not authorized");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require(block.timestamp < p.releaseTime, "Too late to edit - request admin");

        // Validate new release time if provided
        if (newReleaseTime != 0) {
            require(newReleaseTime >= block.timestamp + MIN_RELEASE_BUFFER, "Release time too soon");
            p.releaseTime = newReleaseTime;
        }

        // Update recipient if provided
        if (newRecipient != address(0)) {
            require(newRecipient != p.sender, "Cannot send to yourself");
            p.recipient = newRecipient;
        }

        // Update country if provided
        if (bytes(newCountry).length > 0) {
            p.country = newCountry;
        }

        // Handle amount change
        if (msg.value > 0) {
            // User sent more ETH — increase amount
            p.amount += msg.value;
        }

        emit PaymentEdited(id, p.recipient, p.amount, p.releaseTime);
    }

    /**
     * @notice Edit a scheduled payment after release time (executor/owner only)
     * @dev Used by admin to apply approved edit requests
     */
    function adminEdit(
        uint256 id,
        address payable newRecipient,
        uint256 newAmount,
        uint256 newReleaseTime,
        string calldata newCountry
    ) external payable nonReentrant onlyExecutorOrOwner {
        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");

        if (newRecipient != address(0)) p.recipient = newRecipient;
        if (newReleaseTime != 0) p.releaseTime = newReleaseTime;
        if (bytes(newCountry).length > 0) p.country = newCountry;

        // Handle amount adjustment
        if (newAmount > 0 && newAmount != p.amount) {
            if (newAmount > p.amount) {
                // Need more funds
                require(msg.value == newAmount - p.amount, "Incorrect ETH sent");
                p.amount = newAmount;
            } else {
                // Refund difference
                uint256 refundAmt = p.amount - newAmount;
                p.amount = newAmount;
                (bool success,) = payable(p.sender).call{value: refundAmt}("");
                require(success, "Refund failed");
            }
        }

        emit PaymentEdited(id, p.recipient, p.amount, p.releaseTime);
    }

    /**
     * @notice Top up an existing payment's amount (sender only)
     * @dev Used when a user approves an increase via an edit request - they pay the difference directly
     */
    function topUp(uint256 id) external payable nonReentrant whenNotPaused {
        Payment storage p = payments[id];
        require(msg.sender == p.sender, "Not authorized");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require(msg.value > 0, "Amount must be > 0");
        p.amount += msg.value;
        emit PaymentEdited(id, p.recipient, p.amount, p.releaseTime);
    }

    function execute(uint256 id) external nonReentrant whenNotPaused onlyExecutorOrOwner {
        Payment storage p = payments[id];
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Payment cancelled");
        require(block.timestamp >= p.releaseTime, "Too early");

        p.executed = true;
        (bool success,) = p.recipient.call{value: p.amount}("");
        require(success, "Transfer failed");

        emit PaymentExecuted(id, p.recipient, p.amount);
    }

    function cancel(uint256 id) external nonReentrant {
        Payment storage p = payments[id];
        require(msg.sender == p.sender || msg.sender == executor || msg.sender == owner(), "Not authorized");
        require(!p.executed, "Already executed");
        require(!p.cancelled, "Already cancelled");
        require((!p.executed && block.timestamp < p.releaseTime) || (msg.sender == executor || msg.sender == owner()), "Too late to cancel");

        uint256 refundAmt = p.amount;
        p.cancelled = true;
        (bool success,) = payable(p.sender).call{value: refundAmt}("");
        require(success, "Refund failed");

        // Emit three-arg PaymentCancelled to match tests
        emit PaymentCancelled(id, p.sender, refundAmt);
    }

    function getPayment(uint256 id) external view returns (Payment memory) { return payments[id]; }
    function getUserPayments(address user) external view returns (uint256[] memory) { return userPayments[user]; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function emergencyWithdraw(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        emit EmergencyWithdraw(to, balance);
        (bool success,) = to.call{value: balance}("");
        require(success, "Withdraw failed");
    }

    function getBalance() external view returns (uint256) { return address(this).balance; }
    receive() external payable {}
}
