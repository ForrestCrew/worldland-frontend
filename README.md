# Worldland Frontend

**Next.js Web3 DApp for GPU rental marketplace**

The frontend provides wallet connection via RainbowKit, SIWE authentication, and interfaces for both GPU providers and renters.

## Quick Start (5 minutes)

```bash
npm install
cp .env.example .env.local
# Edit .env.local: Add your WalletConnect Project ID
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - you should see the Worldland homepage with a "Connect Wallet" button.

## Prerequisites

**Required:**
- Node.js 18.0.0 or higher ([download](https://nodejs.org/))
- npm 9.0.0 or higher (comes with Node.js)
- MetaMask browser extension ([download](https://metamask.io/))

**Check versions:**
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## Installation

### 1. Install dependencies

```bash
cd worldland-front
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see Configuration section).

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Verify:**
- Homepage loads with Worldland branding
- "Connect Wallet" button appears in header
- Clicking "Connect Wallet" shows wallet options (MetaMask first)

## Configuration

### Environment Variables

Create `.env.local` (do not commit this file):

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID | Yes* | WalletConnect Cloud project ID |
| NEXT_PUBLIC_API_BASE_URL | Yes | Hub API URL (e.g., http://localhost:8080) |
| NEXT_PUBLIC_SERVER_WALLET_ADDRESS | Yes | Server wallet for payments |
| NEXT_PUBLIC_SEPOLIA_RPC_URL | No | Custom Sepolia RPC (has default) |

*WalletConnect ID is optional for MetaMask-only testing, but required for WalletConnect to work.

### Getting WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Sign in or create account
3. Click "Create Project"
4. Enter project name (e.g., "Worldland Dev")
5. Copy the Project ID
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
   ```

**Note:** Without a WalletConnect Project ID, the app still works with MetaMask (direct injection). WalletConnect mobile wallet connections will not work.

### Connecting to Local Hub

For local development with Hub running:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

For production:
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.worldland.io
```

## Tech Stack

- **Next.js 14+** - React framework with App Router
- **RainbowKit** - Wallet connection UI
- **wagmi v2** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - UI components
- **Sonner** - Toast notifications

## Project Structure

```
worldland-front/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Homepage
│   ├── provider/           # Provider dashboard
│   └── rent/               # Rental pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── wallet/             # Wallet-related components
│   └── providers/          # Provider components
├── config/
│   ├── chains.ts           # Supported blockchain networks
│   └── wagmi.config.ts     # RainbowKit + wagmi config
├── contexts/               # React contexts
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities
│   └── errors/             # Error handling utilities
├── types/                  # TypeScript types
└── public/                 # Static assets
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
```

## Supported Networks

| Network | Chain ID | Use Case |
|---------|----------|----------|
| Sepolia | 11155111 | Development/Testing |
| Ethereum Mainnet | 1 | ENS resolution only |
| BNB Chain | 56 | Production |
| BNB Testnet | 97 | Future use |

Default development network: **Sepolia**

## Wallet Connection

The wallet modal shows:
1. **Recommended:** MetaMask
2. **Other Wallets:** WalletConnect, Coinbase Wallet

### SIWE Authentication

After wallet connection, users sign a SIWE (Sign-In With Ethereum) message to authenticate with Hub:

1. Connect wallet (MetaMask/WalletConnect)
2. Fetch nonce from Hub (`/api/v1/auth/nonce`)
3. Sign SIWE message
4. Verify signature with Hub (`/api/v1/auth/verify`)
5. Receive session token

## Troubleshooting

### "WalletConnect Project ID not set" warning

**Cause:** Missing `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`

**Solution:**
1. Get Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Add to `.env.local`
3. Restart dev server (`npm run dev`)

### Wallet connection fails

**Cause:** Network mismatch or MetaMask not installed.

**Solution:**
1. Install MetaMask extension
2. Switch MetaMask to Sepolia network
3. Refresh the page

### API calls fail with CORS error

**Cause:** Hub CORS not configured for frontend origin.

**Solution:**
Ensure Hub allows `http://localhost:3000` in CORS settings. This is default in dev mode.

### "500 Internal Server Error" from Hub

**Cause:** Hub not running or database not connected.

**Solution:**
```bash
# Check Hub is running
curl http://localhost:8080/health

# If not, start Hub (see worldland-hub README)
cd ../worldland-hub
docker-compose up -d postgres
./hub
```

### Page shows "Hydration mismatch" error

**Cause:** Server and client HTML don't match (SSR issue).

**Solution:**
This can happen with wallet state. Try:
1. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser cache
3. Disconnect wallet and reconnect

## Development Tips

### Hot Reload
The dev server supports hot reload. Most changes appear instantly without refresh.

### TypeScript
The project uses strict TypeScript. Run `npm run lint` before committing.

### Adding UI Components
Use shadcn/ui CLI to add new components:
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

### Testing Wallet Flows
1. Use Sepolia testnet (get test ETH from faucet)
2. MetaMask test accounts work fine for development
3. For WalletConnect testing, use mobile wallet app

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Or connect GitHub repo to Vercel for automatic deployments.

### Environment Variables in Production

Set these in Vercel dashboard or your hosting provider:
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SERVER_WALLET_ADDRESS`

## License

MIT
