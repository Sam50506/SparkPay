# ArcPay — Cross Border USDC Remittance

A cross border USDC remittance dApp built on Arc Testnet. Send USDC to 20+ countries instantly with zero fees, no KYC, and instant settlement.

**Live:** https://arc-remittance.vercel.app

## Features

- **Send USDC** — Instant transfers to any wallet on Arc Testnet
- **Multi Send** — Send to multiple recipients in one session
- **Invoice System** — Create and pay USDC invoices stored on Supabase
- **Faucet** — Claim free testnet USDC via Circle Faucet
- **Transaction History** — Real time status with on-chain confirmation
- **Exchange Rates** — Live conversion rates for 20+ countries
- **Fee Comparison** — ArcPay vs banks and other services
- **Cashback Rewards** — Earn on every confirmed transaction
- **Contacts** — Save frequent wallet addresses
- **Scheduled Payments** — Set up recurring payment reminders
- **QR Receive** — Generate QR code and payment links
- **Dark and Light Mode** — Full theme support

## Supported Wallets

- MetaMask, Brave, OKX, Rabby, Coinbase, Mises Browser
- WalletConnect (300+ wallets)

## Network Details

| | |
|---|---|
| Network | Arc Testnet |
| Chain ID | 5042002 |
| RPC | rpc.testnet.arc.network |
| USDC Contract | 0x3600000000000000000000000000000000000000 |
| Remittance Contract | 0x91F07CE441cD7c39C4c43EB86A7ABd6F9cc48F44 |
| Block Explorer | testnet.arcscan.app |

## Tech Stack

React, ethers.js v6, Supabase, WalletConnect v2, Recharts, Vercel

## Getting Started

    git clone https://github.com/Sam50506/arc-remittance.git
    cd arc-remittance
    npm install

Create a .env file with:

    REACT_APP_SUPABASE_URL=your_supabase_url
    REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
    REACT_APP_ARC_RPC=https://rpc.testnet.arc.network
    REACT_APP_WC_ID=your_walletconnect_project_id
    REACT_APP_CIRCLE_API_KEY=your_circle_api_key

Then run: npm start

## Built By

Sam — https://x.com/Sam_50506

Built on Arc Testnet as part of the Arc ecosystem.
