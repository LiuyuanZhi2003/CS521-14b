# CS521-14B: Blockchain Bridge

A simplified lock-and-mint bridge between two local test chains.  
Tokens are locked on Chain A, a relayer signs an attestation, and wrapped tokens are minted on Chain B.

---

## Architecture

```
User → LockBox (Chain A) → [TokensLocked event]
                                    ↓
                               Relayer signs attestation
                                    ↓
                          MintBridge (Chain B) → WrappedToken.mint()
```

### Contracts

| Contract | Chain | Role |
|---|---|---|
| `SourceToken.sol` | A | ERC-20 token to be bridged |
| `LockBox.sol` | A | Locks SRC tokens, emits `TokensLocked` event |
| `WrappedToken.sol` | B | Mints/burns wSRC, verifies relayer signature |
| `MintBridge.sol` | B | Receives attestations from relayer, calls `mint()` |

### Trust Model

This bridge uses a **single trusted relayer** — the simplest (and weakest) trust model, equivalent to a 1-of-1 multisig. The relayer signs attestations with its private key; `WrappedToken` verifies the signature on-chain using `ecrecover`. A compromised relayer key means a compromised bridge. This mirrors the externally-verified category that led to the Ronin ($625M) and Wormhole ($320M) exploits.

---

## Project Structure

```
CS521-14B/
├── chains/
│   ├── chainA.js       # Deploy script for Chain A
│   ├── chainB.js       # Deploy script for Chain B
│   └── demo.js         # End-to-end bridge demo
├── contracts/
│   ├── SourceToken.sol
│   ├── LockBox.sol
│   ├── WrappedToken.sol
│   └── MintBridge.sol
├── relayer/
│   └── relayer.js      # Listens for events, signs and submits attestations
├── scripts/
│   ├── deployA.js
│   └── deployB.js
├── .env.example
├── hardhat.config.js
└── package.json
```

---

## Setup

### Prerequisites

- Node.js v18+
- npm

### Install

```bash
npm install
chmod +x node_modules/.bin/hardhat
```

### Configure environment

```bash
cp .env.example .env
```

Fill in addresses after deployment (see below). `RELAYER_KEY` and `USER_KEY` are pre-filled with Hardhat's default accounts for local testing.

---

## Running the Bridge

You will need **four terminal windows**.

### Terminal 1 — Chain A
```bash
npm run node:chainA
```

### Terminal 2 — Chain B
```bash
npm run node:chainB
```

### Terminal 3 — Compile & Deploy

```bash
npm run compile

# Deploy to Chain A — copy output addresses into .env
npm run deploy:chainA

# Deploy to Chain B — copy output addresses into .env
npm run deploy:chainB
```

### Terminal 3 — Start Relayer (after filling .env)
```bash
npm run relayer
```

### Terminal 4 — Run Demo
```bash
npm run demo
```

---

## Expected Output

```
=== Bridge Demo ===

[Before] SRC  on Chain A: 1000000.0
[Before] wSRC on Chain B: 0.0

Step 1: Approving LockBox to spend 100 SRC...
Approved.

Step 2: Locking 100 SRC on Chain A...
Tokens locked. Waiting for relayer...

[After]  SRC  on Chain A: 999900.0
[After]  wSRC on Chain B: 100.0

✓ Bridge successful!
```

Relayer terminal will show:

```
=================================
Relayer started
Relayer address : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Listening on    : LockBox @ 0x... (Chain A :8545)
Submitting to   : MintBridge @ 0x... (Chain B :8546)
=================================

[Chain A] TokensLocked
  Sender : 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Amount : 100.0 SRC
  Nonce  : 1
[Relayer] Signed attestation: 0xd440cfa5...
[Chain B] Minted 100.0 wSRC to 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

## How It Works

1. User approves `LockBox` to spend their `SourceToken`
2. User calls `LockBox.lock(amount)` — tokens are transferred to the contract and a `TokensLocked(sender, amount, nonce)` event is emitted
3. Relayer detects the event on Chain A, signs `keccak256(sender, amount, nonce)` with its private key
4. Relayer calls `MintBridge.bridge(to, amount, nonce, signature)` on Chain B
5. `MintBridge` forwards to `WrappedToken.mint()`, which verifies the signature via `ecrecover`
6. If valid and nonce is unused, `wSRC` is minted 1:1 to the user

### Replay Attack Prevention

Each lock event has a unique `nonce`. `WrappedToken` tracks `processedNonces` — attempting to mint with the same nonce twice reverts with `"Nonce already processed"`.

---

## Security Notes

This is a **demo project** for educational purposes.

| Limitation | Production Solution |
|---|---|
| Single trusted relayer | Multi-sig validator set (Wormhole), or light clients (IBC) |
| No burn-and-unlock (return path) | Full bidirectional bridge with unlock on Chain A |
| No timeout/expiry on attestations | Add deadline to signed message |
| Private keys in `.env` | HSM or MPC key management |

---

## Authors

Liuyuan Zhi, Baige He — CS521 Topic 14B