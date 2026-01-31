# BlackWallet

[![Try Live App](https://img.shields.io/badge/Try_Live_App-commonwealth--beta.vercel.app-success?style=for-the-badge&logo=vercel)](https://commonwealth-beta.vercel.app)
![License](https://img.shields.io/badge/license-Private-red?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![Base](https://img.shields.io/badge/Base-Layer%202-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-orange?style=for-the-badge)

**Access the platform now at [https://commonwealth-beta.vercel.app](https://commonwealth-beta.vercel.app)**

BlackWallet is a next-generation financial platform built to empower you with clarity and control. By combining professional-grade tools with advanced AI insights, we help you navigate the digital asset landscape with confidence.

---

## Key Benefits

### 📊 Financial Awareness
Gain a comprehensive understanding of your portfolio. BlackWallet provides a unified view of your assets, helping you track performance and manage your financial health with precision on the Base network.

### 🛡️ Financial Safety
Put yourself in a safe financial position. We prioritize security and self-custody, giving you full control over your assets while utilizing secure, decentralized protocols to protect your wealth.

### 🧠 Informed Investment Decisions
Make moves based on data, not just intuition. Leveraged by Google Gemini AI, our platform provides real-time market sentiment analysis and intelligent insights, enabling you to make smarter, more informed investment choices.

---

## Features

### Advanced Trading & Management
- **High-Speed Execution**: Fast, low-cost interactions on the Base Layer 2 network.
- **Smart Optimization**: Efficient trade routing using top-tier protocols like 0x API and Uniswap V3.
- **Professional Charting**: Interactive, real-time visual tools to analyze market trends effectively.
- **Universal Connectivity**: Securely connect with trusted wallets including Coinbase Wallet and MetaMask.

### AI-Powered Intelligence
- **Market Sentinel**: Automated analysis of market trends to highlight potential opportunities and risks.
- **Personalized Insights**: Tailored data to suit your trading behavior and goals.
- **Smart Assistant**: An integrated AI companion to assist with market queries and platform support.

---

## Technical Overview

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
