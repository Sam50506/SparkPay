// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Remittance {
    address public owner;

    struct Invoice {
        address creator;
        address recipient;
        uint256 amount;
        string description;
        string country;
        bool paid;
        uint256 createdAt;
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

    event MoneySent(address indexed sender, address indexed recipient, uint256 amount, string country, bytes32 invoiceId);
    event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, uint256 amount);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer);

    constructor() {
        owner = msg.sender;
    }

    function createInvoice(address recipient, uint256 amount, string memory description, string memory country) external returns (bytes32) {
        bytes32 invoiceId = keccak256(abi.encodePacked(msg.sender, recipient, amount, block.timestamp));
        invoices[invoiceId] = Invoice(msg.sender, recipient, amount, description, country, false, block.timestamp);
        userInvoices[msg.sender].push(invoiceId);
        emit InvoiceCreated(invoiceId, msg.sender, amount);
        return invoiceId;
    }

    function payInvoice(address token, bytes32 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(!inv.paid, "Already paid");
        require(inv.amount > 0, "Invalid invoice");
        inv.paid = true;
        IERC20(token).transfer(inv.creator, inv.amount);
        payments[msg.sender].push(Payment(msg.sender, inv.creator, inv.amount, inv.country, block.timestamp, invoiceId));
        emit InvoicePaid(invoiceId, msg.sender);
        emit MoneySent(msg.sender, inv.creator, inv.amount, inv.country, invoiceId);
    }

    function sendMoney(address token, address recipient, uint256 amount, string memory country) external {
        IERC20(token).transfer(recipient, amount);
        payments[msg.sender].push(Payment(msg.sender, recipient, amount, country, block.timestamp, bytes32(0)));
        emit MoneySent(msg.sender, recipient, amount, country, bytes32(0));
    }

    function getPayments(address user) external view returns (Payment[] memory) {
        return payments[user];
    }

    function getUserInvoices(address user) external view returns (bytes32[] memory) {
        return userInvoices[user];
    }
}
