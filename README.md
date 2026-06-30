# SparkPay : Cross-Border USDC Remittance

A full-stack Web3 remittance dApp built on Arc Testnet. Send USDC to 150+ countries instantly with zero fees, no KYC, and instant settlement.

**Live:** https://sparkpay.live

## Features

- Send USDC instantly to any wallet on Arc Testnet
- Multi Send batch payments to up to 150 recipients
- Scheduled Payments with on-chain escrow
- Invoice creation and payment system
- QR code generation and scanning
- Cashback Rewards (1% on transactions 5+ USDC)
- Contacts management
- Transaction History with CSV export
- Exchange Rates for 150+ countries
- Fee Comparison vs traditional remittance
- Admin Portal with maintenance mode
- PWA support
- Dark and Light Mode

## Architecture

Frontend: React, deployed on Vercel
Smart Contracts: Solidity, OpenZeppelin
Backend: Vercel serverless functions, Supabase
Automation: Railway cron with GitHub Actions fallback
Security: Cloudflare Turnstile, internal API secrets

## Smart Contracts

Arc Testnet, Chain ID 5042002

ScheduledPayment: 0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57
Remittance: 0x6338e79f2C218E41A78D75E336867549E2c300ee

Both verified on Arc explorer with automated test coverage.

## Tech Stack

React, ethers.js v6, Solidity, OpenZeppelin, Supabase, Vercel, Railway, Cloudflare Turnstile, WalletConnect v2, MetaMask

## License

MIT
