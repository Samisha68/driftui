# DriftDeck - A Perp Trading Dashboard on Solana

**Trade with Drift** is a feature-rich frontend built with **Next.js**, **TailwindCSS**, **Zustand**, and the **Drift SDK**, designed to simulate a trading experience for Drift Protocol users.

It supports viewing and managing subaccounts, balances, perp positions, and open orders. This project is tailored to demonstrate a realistic trading dashboard experience, even when RPC connectivity is unstable.

---

## 🔧 Features

- ✅ **Solana Wallet Adapter Integration**
- ✅ **View Connected Wallet's Subaccounts**
- ✅ **Balances, Positions, and Orders per Subaccount**
- ✅ **Deposit & Withdraw (Mock UI)**
- ✅ **Market and Limit Order Simulation**
- ✅ **Wallet Viewer Mode** to inspect any wallet’s Drift data
- ✅ **Responsive Design** using TailwindCSS
- ✅ **Global State Management** via Zustand

---

## 🚨 Note on RPC and Dummy Data

Due to possible instability or rate-limiting issues with public Solana RPC endpoints (e.g., Helius or other providers), this project **uses dummy data to simulate subaccount activity**.

You can easily switch to live data by plugging in:
- `driftClient.getUserAccountsForAuthority(publicKey)`
- `driftClient.getUser(publicKey)`
- `driftClient.placePerpOrder(...)` and similar SDK calls

Drift SDK documentation: [https://drift-labs.github.io/v2-teacher](https://drift-labs.github.io/v2-teacher)

---

## 🛠 Tech Stack

- **Next.js** (App directory)
- **TailwindCSS**
- **Zustand** (for state management)
- **Framer Motion** (animations)
- **@drift-labs/sdk-browser**
- **@solana/wallet-adapter**

---

## 📦 Getting Started

```bash
git clone https://github.com/Samisha68/driftui.git
cd driftui
npm install
npm run dev
```

> ⚠️ You may need to configure your wallet adapter and network inside the `WalletProvider` wrapper.

---

## 🧠 Future Improvements

- Switch dummy data to live Drift client responses
- Add PnL tracking and margin health
- Integrate charts and advanced order types (TP/SL, scaled orders)

---

## 📄 License

This project is for educational/demo purposes and is not intended for production trading use.

---

Built with 💙 and lots of coffee by **Samisha** ☕

