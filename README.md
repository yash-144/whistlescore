# WhistleScore
> A privacy-preserving workplace safety & hazard counter built on Midnight using zero-knowledge proofs.

## Live Demo
[PASTE LIVE URL AFTER DEPLOYING FRONTEND]

## Contract Address
| Network  | Address                          |
|----------|----------------------------------|
| Preprod  | `8d1e491d24fc5e2c43e16204ed8e4ac8cd26ad3659899b9769819d7ccd53c15f` |

## What This Does
WhistleScore is a privacy-first decentralized workplace safety reporting application. In high-stakes and regulated industries (e.g. aviation, chemical manufacturing, healthcare), workers often fear retaliation if they report safety violations. 

WhistleScore solves this dilemma by allowing employees to add incident severity points to an immutable, public company hazard score. Using Midnight's zero-knowledge smart contract, an employee proves they hold a valid internal authorization token without ever disclosing the token or their identity to the company, auditors, or on-chain observers.

## Privacy Model
- **What is PUBLIC:**
  - The `counter` state variable stored in the contract ledger (the cumulative hazard severity score).
  - The `step` amount (e.g., +1, +3, +5) deliberately disclosed when invoking the `increment` circuit.
- **What is PRIVATE:**
  - The `secret_token` private witness parameter supplied by the caller. It remains strictly in local memory and is never placed on-chain.
- **What the user PROVES without revealing:**
  - The user proves they possess a valid authorization token (`secret_token == 42`) entitled to log workplace hazard points, without revealing the token or any identifying information.

## Privacy Claim
An on-chain observer or company auditor can observe the updated public safety score and the exact severity step increment, but cannot see who submitted the transaction, which authorization voucher was used, or any private credentials. The zero-knowledge proof verifies authorization mathematically while preserving complete whistleblower anonymity.

## Tech Stack
Midnight network, Compact, Midnight.js SDK, React/Vite, Lace wallet

## Prerequisites
- Midnight Lace wallet installed (browser extension)
- Node.js v22

## Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/yash-144/whistlescore.git
   cd whistlescore
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
4. Run tests:
   ```bash
   npm test
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Demo Video
[PLACEHOLDER — I will add the link after recording]
