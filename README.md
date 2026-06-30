# SparkPay

Cross-Border USDC Remittance on Arc Testnet

Live: https://sparkpay.live

## Features

- Send USDC instantly to any wallet on Arc Testnet
- Multi Send batch payments to multiple recipients
- Scheduled Payments with on-chain escrow and countdown timer
- Cancel or edit scheduled payments before release
- Invoice creation and payment system
- QR code generation and scanning
- Cashback Rewards (1% on transactions 5 USDC and above)
- Contacts management
- Transaction History with CSV export
- Exchange Rates for 150+ countries
- Fee Comparison vs traditional remittance
- Admin Portal with passkey and PIN authentication, maintenance mode
- PWA support
- Dark and Light Mode

## Architecture

Frontend: React, deployed on Vercel
Smart Contracts: Solidity, OpenZeppelin, deployed on Arc Testnet
Backend: Vercel serverless functions (8 endpoints)
Database: Supabase
Security: Cloudflare Turnstile, WebAuthn passkey, PIN fallback, JWT sessions, Upstash rate limiting

## Smart Contracts

Arc Testnet, Chain ID 5042002

ScheduledPayment: 0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57
Remittance: 0x6338e79f2C218E41A78D75E336867549E2c300ee

## Tech Stack

React, ethers.js v6, Solidity, OpenZeppelin, Supabase, Vercel, Cloudflare Turnstile, Upstash Redis, WalletConnect v2, SimpleWebAuthn

## License

MIT
