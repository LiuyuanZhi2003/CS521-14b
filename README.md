# CS521-14b
Implement a simplified bridge between two local test chains that locks tokens on one chain and mints wrapped tokens on the other, using a relayer to pass attestations.

## Architecture

- Chain A
  - SourceToken
  - LockBox
- Chain B
  - WrappedToken
  - MintBridge
- Relayer
  - listens for Locked events on Chain A
  - submits attestations to Chain B

## Flow

1. User locks SRC on Chain A
2. LockBox emits a Locked event
3. Relayer listens and forwards the attestation
4. MintBridge on Chain B mints wSRC

## Run

### 1. Install
```bash
npm install