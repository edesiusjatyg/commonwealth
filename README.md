# CommonWealth

<div align="center">
  <br />
  <br />
  <img src="public/logo.png" alt="CommonWealth Logo" width="180" />
  <br />
  <br />

  [![Try Live App](https://img.shields.io/badge/Try_Live_App-commonwealth--beta.vercel.app-success?style=for-the-badge&logo=vercel)](https://commonwealth-beta.vercel.app)
  ![License](https://img.shields.io/badge/license-Private-red?style=for-the-badge)
  ![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
  ![Base](https://img.shields.io/badge/Base-Layer%202-blue?style=for-the-badge)
  ![AI Powered](https://img.shields.io/badge/AI-Gemini%20Powered-orange?style=for-the-badge)
</div>

**Access the platform now at [https://commonwealth-beta.vercel.app](https://commonwealth-beta.vercel.app)**

CommonWealth is a next-generation financial platform built to empower you with clarity and control. By combining professional-grade tools with advanced AI insights, we help you navigate the digital asset landscape with confidence.
<br><br>
## Development Team

<div align="center">
  <table border="0" style="border-collapse: collapse;">
    <tr>
      <td align="center" width="150" style="border: none;">
        <a href="https://github.com/edesiusjatyg">
          <img src="https://github.com/edesiusjatyg.png" width="80px;" alt="edesiusjatyg"/>
          <br />
          <sub><b>edesiusjatyg</b></sub>
        </a>
      </td>
      <td align="center" width="150" style="border: none;">
        <a href="https://github.com/JavaneseIvankov">
          <img src="https://github.com/JavaneseIvankov.png" width="80px;" alt="JavaneseIvankov"/>
          <br />
          <sub><b>JavaneseIvankov</b></sub>
        </a>
      </td>
      <td align="center" width="150" style="border: none;">
        <a href="https://github.com/ElFariss">
          <img src="https://github.com/ElFariss.png" width="80px;" alt="ElFariss"/>
          <br />
          <sub><b>ElFariss</b></sub>
        </a>
      </td>
      <td align="center" width="150" style="border: none;">
        <a href="https://github.com/Clydeew">
          <img src="https://github.com/Clydeew.png" width="80px;" alt="Clydeew"/>
          <br />
          <sub><b>Clydeew</b></sub>
        </a>
      </td>
      <td align="center" width="150" style="border: none;">
        <a href="https://github.com/Bagas-21">
          <img src="https://github.com/Bagas-21.png" width="80px;" alt="Bagas-21"/>
          <br />
          <sub><b>Bagas-21</b></sub>
        </a>
      </td>
    </tr>
  </table>
</div>
<br>

## Key Benefits

### 🤖 A "Financial Copilot" for Crypto
CommonWealth acts like a smart bank account for your digital assets. **The Oracle** doesn't just look at code; it looks at your *behavior*. It differentiates between a "swap" and a "coffee purchase", analyzes your net flow, and gives you actionable insights like "You've spent 20% more on gas fees this month."

### 🏦 Bank-Grade Security with Self-Custody
We solve the "what if I get hacked?" fear.
-   **Daily Limits**: Set a daily spending cap (e.g., $1,000/day). Even if your key is stolen, your life savings can't be drained instantly.
-   **Social Recovery (Emergency Contacts)**: Designate trusted contacts who can approve overriding these limits or help secure your account if compromised.

### 📈 An Investment Strategist in Your Pocket
Remove the noise from trading.
-   **Nostradamus**: Analyzes market sentiment for you, telling you if the "vibe" is bullish or bearish based on data, not hype.
-   **Scribe**: A chat friend you can ask "What is a Layer 2?" or "Why did my transaction fail?" and get a plain English answer.

---

## Features

### Integrated Financial Health
-   **Unified Dashboard**: A single view combining your daily spending ("checking") and investment portfolio.
-   **Yield Tracking**: Track passive income separately from active trading gains.

### Smart Security
-   **Daily Caps**: Configurable spending limits to control outflow.
-   **Emergency Approvals**: A "human element" to decentralized security allowing trusted contacts to intervene in critical situations.

### AI Staff
-   **The Oracle**: Your personal financial overseer. Keep a pulse on your current financial health, net worth, and spending patterns.
-   **Nostradamus**: Your future-gazing strategist. Receive advanced market insights and comprehensive outlooks.
-   **Scribe**: Your dedicated crypto companion. Chat freely and discuss complex topics in plain English.

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
commonwealth/
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
