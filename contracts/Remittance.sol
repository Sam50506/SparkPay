// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

contract Remittance {
    address public owner;

    struct Invoice {
        address creator;   // who created the invoice (gets paid)
        address payer;     // who should pay (0x0 = anyone can pay)
        uint256 amount;
        string description;
        string country;
        bool paid;
        uint256 createdAt;
        uint256 nonce;     // unique nonce per creator to avoid timestamp collision
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
    mapping(address => uint256) public nonces; // per-address nonce

    event MoneySent(address indexed sender, address indexed recipient, uint256 amount, string country, bytes32 invoiceId);
    event InvoiceCreated(bytes32 indexed invoiceId, address indexed creator, address indexed payer, uint256 amount);
    event InvoicePaid(bytes32 indexed invoiceId, address indexed payer);

    constructor() {
        owner = msg.sender;
    }

    // Create invoice — invoiceId is deterministic and predictable
    // Uses nonce instead of block.timestamp so staticCall gives correct ID
    function createInvoice(
        address payer,
        uint256 amount,
        string memory description,
        string memory country
    ) external returns (bytes32) {
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

    // Pay invoice — payer calls this, USDC pulled from payer via transferFrom
    function payInvoice(address token, bytes32 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.createdAt > 0, "Invoice not found");
        require(!inv.paid, "Already paid");
        require(inv.amount > 0, "Invalid invoice");
        // If payer is specified, only they can pay
        if (inv.payer != address(0)) {
            require(msg.sender == inv.payer, "Not the designated payer");
        }
        inv.paid = true;
        // Pull USDC from payer to invoice creator
        require(IERC20(token).transferFrom(msg.sender, inv.creator, inv.amount), "Transfer failed");
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

    // Send USDC directly — pulls from caller via transferFrom
    function sendMoney(
        address token,
        address recipient,
        uint256 amount,
        string memory country
    ) external {
        require(IERC20(token).transferFrom(msg.sender, recipient, amount), "Transfer failed");
        payments[msg.sender].push(Payment({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            country: country,
            timestamp: block.timestamp,
            invoiceId: bytes32(0)
        }));
        emit MoneySent(msg.sender, recipient, amount, country, bytes32(0));
    }

    function getPayments(address user) external view returns (Payment[] memory) {
        return payments[user];
    }

    function getUserInvoices(address user) external view returns (bytes32[] memory) {
        return userInvoices[user];
    }

    // Get invoice details
    function getInvoice(bytes32 invoiceId) external view returns (
        address creator, address payer, uint256 amount,
        string memory description, string memory country,
        bool paid, uint256 createdAt
    ) {
        Invoice storage inv = invoices[invoiceId];
        return (inv.creator, inv.payer, inv.amount, inv.description, inv.country, inv.paid, inv.createdAt);
    }
}
