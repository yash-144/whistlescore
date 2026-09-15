# WhistleScore
[![CI](https://github.com/yash-144/whistlescore/actions/workflows/ci.yml/badge.svg)](https://github.com/yash-144/whistlescore/actions/workflows/ci.yml)
> A privacy-preserving workplace safety & hazard counter built on Midnight using zero-knowledge proofs.

## Live Demo
https://whistlescore.vercel.app

## Contract Address
| Network  | Address                          |
|----------|----------------------------------|
| Preprod  | `8d1e491d24fc5e2c43e16204ed8e4ac8cd26ad3659899b9769819d7ccd53c15f` |

## What This Does
WhistleScore is a privacy-first decentralized workplace safety reporting application. In high-stakes and regulated industries (such as aviation, chemical manufacturing, healthcare, and energy), workers often fear retaliation if they report safety violations or regulatory lapses.

WhistleScore solves this dilemma by enabling authorized personnel to log incident severity points to an immutable, public company hazard score. Using Midnight's zero-knowledge smart contracts, an employee proves they hold a valid internal authorization token without ever disclosing the token or their personal identity to employers, auditors, or on-chain observers.

## Privacy Model
- PUBLIC: The `counter` state variable stored in the contract ledger (the cumulative hazard severity score) and the `step` increment (+1, +3, +5) deliberately disclosed when invoking the `increment` circuit.
- PRIVATE: The `secret_token` private witness parameter supplied by the caller. It remains strictly in local browser memory and is never published on-chain.
- PROVED without revealing: The user proves they possess a valid authorization token (`secret_token == 42`) entitled to log workplace hazard points, without revealing the token or any identifying information.

## Privacy Claim
What an on-chain observer sees vs cannot see:
- **What is visible**: An on-chain observer or company auditor can view the public contract address, the updated cumulative hazard score (`counter`), and the disclosed severity level added (`step`).
- **What is concealed**: Observers cannot see who submitted the transaction, which authorization voucher or employee secret was used, or any private credentials. The zero-knowledge proof verifies authorization mathematically while preserving complete whistleblower anonymity.

## Tech Stack
- **Network**: Midnight Preprod / Preview Testnet
- **Smart Contract Language**: Compact (`contracts/counter.compact`)
- **SDK & Toolchain**: `@midnight-ntwrk/midnight-js-contracts`, `@midnight-ntwrk/compact-runtime`, Compact compiler `0.31.1`
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS (atmospheric pastoral aesthetic)
- **Wallet Integration**: Midnight Lace Wallet DApp Connector API
- **Testing**: Vitest, Compact Runtime Contract Simulator

## Prerequisites
- Node.js v22 or higher
- npm v10 or higher
- Midnight Lace browser extension (configured for Preprod / Testnet)

## Setup & Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yash-144/whistlescore.git
   cd whistlescore
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the Compact smart contract:
   ```bash
   npm run compile
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## Run Tests
```bash
npm test
```
Executes the automated test suite against the compiled contract simulator covering:
1. Circuit logic computation (+1, +3, +5 increments)
2. Ledger state transitions from initial state through successive calls
3. Privacy preservation (confirming private witness is never exposed in outputs or ledger state and invalid tokens are rejected)

## CI/CD
The repository includes a GitHub Actions continuous integration pipeline defined in `.github/workflows/ci.yml`. On every push and pull request to `main`, the workflow:
1. Checks out the code repository
2. Sets up Node.js v22
3. Installs project dependencies via `npm install`
4. Installs the Compact toolchain and executes `compact compile` to verify contract integrity
5. Runs the automated Vitest test suite (`npm test`) to guarantee all circuits, state transitions, and privacy assertions pass before merge

## Product Proposal
See [PROPOSAL.md](PROPOSAL.md)
