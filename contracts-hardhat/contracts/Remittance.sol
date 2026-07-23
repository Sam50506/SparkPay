// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Remittance is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    struct Invoice {
        address creator;
        address payer;
        uint256 amount;
        string description;
        string country;
        bool paid;
        uint256 createdAt;
        uint256 nonce;
    }

    struct Payment {
        address sender;
        address recipient;
        uint256 amount;
        string country;
        uint256 timestamp;
        bytes32 invoiceId;
    }

    mapping(bytes32 => Invoice) public invoices;
    mapping(address => Payment[]) public payments;
    mapping(address => bytes32[]) public userInvoices;
    mapping(address => uint256) public nonces;

    event MoneySent(address indexed sender, address indexed recipient, uint256 amount, string country, bytes32 invoiceId);
    event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, uint256 amount);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer);
    event BatchSendFailed(address indexed sender, address indexed recipient, uint256 amount, uint256 index);

    constructor() Ownable(msg.sender) {}

    function createInvoice(address payer, uint256 amount, string memory description, string memory country) external returns (bytes32) {
        require(payer != address(0), "Payer required - invoice cannot be open to anyone");
        uint256 nonce = nonces[msg.sender]++;
        bytes32 invoiceId = keccak256(abi.encodePacked(msg.sender, payer, amount, nonce));
        invoices[invoiceId] = Invoice({
            creator: msg.sender,
            payer: payer,
            amount: amount,
            description: description,
            country: country,
            paid: false,
            createdAt: block.timestamp,
            nonce: nonce
        });
        userInvoices[msg.sender].push(invoiceId);
        emit InvoiceCreated(invoiceId, msg.sender, payer, amount);
        return invoiceId;
    }

    // Native-currency payment (Arc Testnet's native currency is USDC) — matches the
    // pattern already used successfully by ScheduledPayment.sol and the plain-transfer
    // single-send flow, instead of treating USDC as a separate pulled ERC20 token.
    function payInvoice(bytes32 invoiceId) external payable nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        require(inv.createdAt > 0, "Invoice not found");
        require(!inv.paid, "Already paid");
        require(inv.amount > 0, "Invalid invoice");
        require(msg.sender == inv.payer, "Not the designated payer");
        require(msg.value == inv.amount, "Incorrect amount sent");
        inv.paid = true;
        (bool success, ) = payable(inv.creator).call{value: msg.value}("");
        require(success, "Transfer failed");
        payments[msg.sender].push(Payment({
            sender: msg.sender,
            recipient: inv.creator,
            amount: inv.amount,
            country: inv.country,
            timestamp: block.timestamp,
            invoiceId: invoiceId
        }));
        emit InvoicePaid(invoiceId, msg.sender);
        emit MoneySent(msg.sender, inv.creator, inv.amount, inv.country, invoiceId);
    }

    function sendMoney(address recipient, string memory country) external payable nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(msg.value > 0, "Invalid amount");
        (bool success, ) = payable(recipient).call{value: msg.value}("");
        require(success, "Transfer failed");
        payments[msg.sender].push(Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            country: country,
            timestamp: block.timestamp,
            invoiceId: bytes32(0)
        }));
        emit MoneySent(msg.sender, recipient, msg.value, country, bytes32(0));
    }

    function batchSend(address[] memory recipients, uint256[] memory amounts, string[] memory countries) external payable nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length == countries.length, "Length mismatch");
        require(recipients.length <= 150, "Max 150 recipients");
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Invalid amount");
            total += amounts[i];
        }
        require(msg.value == total, "Incorrect total sent");

        uint256 refundTotal = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}("");
            if (!success) {
                refundTotal += amounts[i];
                emit BatchSendFailed(msg.sender, recipients[i], amounts[i], i);
                continue;
            }
            payments[msg.sender].push(Payment({
                sender: msg.sender,
                recipient: recipients[i],
                amount: amounts[i],
                country: countries[i],
                timestamp: block.timestamp,
                invoiceId: bytes32(0)
            }));
            emit MoneySent(msg.sender, recipients[i], amounts[i], countries[i], bytes32(0));
        }
        if (refundTotal > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: refundTotal}("");
            require(refunded, "Refund failed");
        }
    }

    function getPayments(address user) external view returns (Payment[] memory) {
        return payments[user];
    }

    function getPaymentsPaginated(address user, uint256 offset, uint256 limit) external view returns (Payment[] memory) {
        Payment[] storage all = payments[user];
        if (offset >= all.length) return new Payment[](0);
        uint256 end = offset + limit;
        if (end > all.length) end = all.length;
        Payment[] memory page = new Payment[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = all[i];
        }
        return page;
    }

    function getPaymentsCount(address user) external view returns (uint256) {
        return payments[user].length;
    }

    function getUserInvoices(address user) external view returns (bytes32[] memory) {
        return userInvoices[user];
    }

    function getInvoice(bytes32 invoiceId) external view returns (
        address creator, address payer, uint256 amount,
        string memory description, string memory country,
        bool paid, uint256 createdAt
    ) {
        Invoice storage inv = invoices[invoiceId];
        return (inv.creator, inv.payer, inv.amount, inv.description, inv.country, inv.paid, inv.createdAt);
    }

    // Rescue any ERC20 tokens accidentally sent to this contract (payments themselves
    // never hold funds here except transiently during batchSend, which self-refunds).
    function emergencyWithdrawToken(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "Nothing to withdraw");
        IERC20(token).safeTransfer(owner(), bal);
    }

    // Rescue any stuck native currency (should not normally accumulate, since batchSend
    // refunds failed sends within the same transaction).
    function emergencyWithdrawNative() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        (bool success, ) = payable(owner()).call{value: bal}("");
        require(success, "Withdraw failed");
    }
}
