# Drift Trading UI

A UI for managing Drift subaccounts and trading on the Solana blockchain.

## Features

- View connected wallet's subaccounts
- View subaccount balances
- View perp positions
- View open orders
- Deposit/Withdraw functionality
- Place market and limit orders

## Prerequisites

- Node.js 18+ and npm
- A Solana wallet (Phantom, Solflare, etc.)
- A Helius RPC API key (for mainnet access)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/drift-trading-ui.git
cd drift-trading-ui
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Helius RPC API key:
```
NEXT_PUBLIC_HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Connect your Solana wallet using the "Connect Wallet" button
2. View your subaccounts and their balances
3. Manage your positions and place orders

## Development

The project uses:
- Next.js for the framework
- Tailwind CSS for styling
- Zustand for state management
- Drift SDK for blockchain interaction
- Solana Wallet Adapter for wallet integration

## License

MIT 