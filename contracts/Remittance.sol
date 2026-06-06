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

                                                constructor() {
                                                            owner = msg.sender;
                                                }

                                                    function createInvoice(address payer, uint256 amount, string memory description, string memory country) external returns (bytes32) {
                                                                uint256 nonce = nonces[msg.sender]++;
                                                                        bytes32 invoiceId = keccak256(abi.encodePacked(msg.sender, payer, amount, nonce));
                                                                                invoices[invoiceId] = Invoice({creator: msg.sender, payer: payer, amount: amount, description: description, country: country, paid: false, createdAt: block.timestamp, nonce: nonce});
                                                                                        userInvoices[msg.sender].push(invoiceId);
                                                                                                emit InvoiceCreated(invoiceId, msg.sender, payer, amount);
                                                                                                        return invoiceId;
                                                    }

                                                        function payInvoice(address token, bytes32 invoiceId) external {
                                                                    Invoice storage inv = invoices[invoiceId];
                                                                            require(inv.createdAt > 0, "Invoice not found");
                                                                                    require(!inv.paid, "Already paid");
                                                                                            require(inv.amount > 0, "Invalid invoice");
                                                                                                    if (inv.payer != address(0)) require(msg.sender == inv.payer, "Not the designated payer");
                                                                                                            inv.paid = true;
                                                                                                                    require(IERC20(token).transferFrom(msg.sender, inv.creator, inv.amount), "Transfer failed");
                                                                                                                            payments[msg.sender].push(Payment({sender: msg.sender, recipient: inv.creator, amount: inv.amount, country: inv.country, timestamp: block.timestamp, invoiceId: invoiceId}));
                                                                                                                                    emit InvoicePaid(invoiceId, msg.sender);
                                                                                                                                            emit MoneySent(msg.sender, inv.creator, inv.amount, inv.country, invoiceId);
                                                        }

                                                            function sendMoney(address token, address recipient, uint256 amount, string memory country) external {
                                                                        require(IERC20(token).transferFrom(msg.sender, recipient, amount), "Transfer failed");
                                                                                payments[msg.sender].push(Payment({sender: msg.sender, recipient: recipient, amount: amount, country: country, timestamp: block.timestamp, invoiceId: bytes32(0)}));
                                                                                        emit MoneySent(msg.sender, recipient, amount, country, bytes32(0));
                                                            }

                                                                function batchSend(address token, address[] memory recipients, uint256[] memory amounts, string[] memory countries) external {
                                                                            require(recipients.length == amounts.length, "Length mismatch");
                                                                                    require(recipients.length == countries.length, "Length mismatch");
                                                                                            require(recipients.length <= 50, "Max 50 recipients");
                                                                                                    uint256 total = 0;
                                                                                                            for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];
                                                                                                                    require(IERC20(token).transferFrom(msg.sender, address(this), total), "Transfer failed");
                                                                                                                            for (uint256 i = 0; i < recipients.length; i++) {
                                                                                                                                            require(IERC20(token).transfer(recipients[i], amounts[i]), "Transfer failed");
                                                                                                                                                        payments[msg.sender].push(Payment({sender: msg.sender, recipient: recipients[i], amount: amounts[i], country: countries[i], timestamp: block.timestamp, invoiceId: bytes32(0)}));
                                                                                                                                                                    emit MoneySent(msg.sender, recipients[i], amounts[i], countries[i], bytes32(0));
                                                                                                                            }
                                                                }

                                                                    function getPayments(address user) external view returns (Payment[] memory) {
                                                                                return payments[user];
                                                                    }

                                                                        function getUserInvoices(address user) external view returns (bytes32[] memory) {
                                                                                    return userInvoices[user];
                                                                        }

                                                                            function getInvoice(bytes32 invoiceId) external view returns (address creator, address payer, uint256 amount, string memory description, string memory country, bool paid, uint256 createdAt) {
                                                                                        Invoice storage inv = invoices[invoiceId];
                                                                                                return (inv.creator, inv.payer, inv.amount, inv.description, inv.country, inv.paid, inv.createdAt);
                                                                            }
}
                                                                            }
                                                                        }
                                                                    }
                                                                                                                            }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                }
            }
}
}