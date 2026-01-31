# BlackWallet

![Project Status](https://img.shields.io/badge/status-active_development-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-Private-red?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![Base](https://img.shields.io/badge/Base-Layer%202-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-orange?style=for-the-badge)

BlackWallet is a next-generation decentralized trading platform built on the **Base Layer 2** blockchain. It combines professional-grade crypto trading tools with advanced **AI-driven market sentiment analysis** to empower traders with real-time insights.

Designed for performance and scalability, BlackWallet leverages a microservices architecture to deliver a seamless user experience, integrating direct smart contract interactions with powerful off-chain analytics.

---

## Key Features

### Core Trading Engine
- **Base Layer 2 Integration**: Lightning-fast, low-cost execution on the Base network.
- **Smart Order Routing**: Optimized trade execution using **0x API** and **Uniswap V3** protocols.
- **Interactive Charting**: Professional-grade charts powered by TradingView's Lightweight Charts and Recharts.
- **Multi-Wallet Support**: Seamless connection with Coinbase Wallet, MetaMask, and other Web3 wallets via Wagmi/Viem.

### AI Intelligence Layer
- **Market Sentiment Analysis**: Real-time evaluation of market trends using Gemini AI.
- **Personalized User Insights**: Behavioral analytics to tailor the trading experience.
- **Smart Chat Assistant**: Integrated AI chatbot for instant support and market queries.

### Robust Architecture
- **Microservices Design**: Decoupled AI services running in isolated Docker containers for maximum reliability.
- **Secure Authentication**: Custom authentication flows with JWT support.
- **Type-Safe Development**: Full TypeScript integration across the full stack.

---

## Technology Stack

### Frontend & Interface
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/) (Shadcn)
- **State Management**: [React Query](https://tanstack.com/query)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Blockchain & Web3
- **Network**: Base Mainnet & Sepolia
- **Interaction**: [Viem](https://viem.sh/) & [Wagmi](https://wagmi.sh/)
- **Smart Contracts**: [Foundry](https://getfoundry.sh/) (Solidity)

### Backend & AI Services
- **Database**: PostgreSQL (managed via [Prisma](https://www.prisma.io/))
- **AI Engine**: Google Gemini API
- **Containerization**: Docker & Docker Compose
- **Service Orchestration**: Microservices running in `layers/ai`

---

## Project Structure

The repository flows a monorepo-style structure:

```
blackwallet/
├── app/                  # Next.js App Router Application
├── components/           # Reusable UI Components
├── layers/               # Microservices & Smart Contracts
│   ├── ai/               # AI Services (Sentiment, Chatbot, Insights)
│   └── contracts/        # Foundry Smart Contract Project
├── lib/                  # Shared Utilities & Helpers
├── prisma/               # Database Schema & Migrations
├── public/               # Static Assets
└── types/                # Global Type Definitions
```

---

## Getting Started

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v20+
- **Docker**: For running AI services and databases.
- **Foundry**: For smart contract development (optional).
- **Git**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/blackwallet.git
    cd blackwallet
    ```

2.  **Install Frontend Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env.local` file in the root directory and configure your keys:
    ```env
    DATABASE_URL="postgresql://..."
    NEXT_PUBLIC_WALLET_CONNECT_ID="..."
    GEMINI_API_KEY="..."
    # Add other service keys as needed
    ```

4.  **Initialize Database**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Running the Application

**Development Server:**
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Running AI Services
To start the backend AI services (Sentiment Analysis, Chatbot, etc.):

```bash
cd layers/ai/market-sentiment-service
docker-compose up -d
```
Repeat for other services in `market-sentiment-service` or `chatbot-service` as required.

---

## Testing

We use **Vitest** for unit and integration testing.

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration
```

---

## Contributing

We welcome contributions! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

---

## License

**Proprietary & Confidential**.
Unauthorized copying or distribution of this file, via any medium, is strictly prohibited.
All Rights Reserved.
