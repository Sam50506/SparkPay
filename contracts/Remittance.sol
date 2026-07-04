// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error InvoiceNotFound();
error AlreadyPaid();
error InvalidInvoice();
error NotDesignatedPayer();
error InvalidRecipient();
error InvalidAmount();

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

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create an invoice payable by `payer`.
     * @dev Stores the invoice and returns its id.
     * @param payer The address expected to pay this invoice. If zero, anyone can pay.
     * @param amount The invoice amount (token smallest unit).
     * @param description Human-readable description for the invoice.
     * @param country Country or region string for the invoice.
     * @return invoiceId The computed invoice identifier.
     */
    function createInvoice(address payer, uint256 amount, string calldata description, string calldata country) external returns (bytes32) {
        uint256 nonce = nonces[msg.sender]++;
        bytes32 invoiceId = keccak256(abi.encodePacked(msg.sender, payer, amount, nonce));
        invoices[invoiceId] = Invoice({
            creator: msg.sender,
            payer: payer,
            amount: amount,
            description: string(description),
            country: string(country),
            paid: false,
            createdAt: block.timestamp,
            nonce: nonce
        });
        userInvoices[msg.sender].push(invoiceId);
        emit InvoiceCreated(invoiceId, msg.sender, payer, amount);
        return invoiceId;
    }

    function payInvoice(address token, bytes32 invoiceId) external nonReentrant {
        Invoice storage inv = invoices[invoiceId];
        if (inv.createdAt == 0) revert InvoiceNotFound();
        if (inv.paid) revert AlreadyPaid();
        if (inv.amount == 0) revert InvalidInvoice();
        if (inv.payer != address(0) && msg.sender != inv.payer) revert NotDesignatedPayer();
        inv.paid = true;
        IERC20(token).safeTransferFrom(msg.sender, inv.creator, inv.amount);
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

    function sendMoney(address token, address recipient, uint256 amount, string calldata country) external nonReentrant {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        IERC20(token).safeTransferFrom(msg.sender, recipient, amount);
        payments[msg.sender].push(Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            country: string(country),
            timestamp: block.timestamp,
            invoiceId: bytes32(0)
        }));
        emit MoneySent(msg.sender, recipient, amount, country, bytes32(0));
    }

    function batchSend(address token, address[] calldata recipients, uint256[] calldata amounts, string[] calldata countries) external nonReentrant {
        if (recipients.length != amounts.length) revert InvalidAmount();
        if (recipients.length != countries.length) revert InvalidAmount();
        if (recipients.length > 50) revert InvalidAmount();
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();
            total += amounts[i];
        }
        IERC20(token).safeTransferFrom(msg.sender, address(this), total);
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidRecipient();
            IERC20(token).safeTransfer(recipients[i], amounts[i]);
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
    }

    function getPayments(address user) external view returns (Payment[] memory) {
        return payments[user];
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

    function emergencyWithdraw(address token) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "Nothing to withdraw");
        IERC20(token).safeTransfer(owner(), bal);
    }
}
