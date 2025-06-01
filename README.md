# SwapLite
A Lite SDK for cross chain swaps between ethereum and solana

## Actors
1. Taker (aka User or Initiator)
✅ Off-chain signs the swap order, including:
What they want to swap
What they want in return
hashlock derived from their secret
Expiration time
✅ Has custody of the secret.
✅ Claims tokens on the destination chain (Solana).

2. Maker (aka Resolver / Executor)
✅ Responsible for executing the order on-chain:
Fills the signed order on Ethereum using 1inch Limit Order Protocol → creates EscrowSrc.
Deploys a corresponding EscrowDst contract (or Anchor PDA) on Solana.
Deposits their own funds into the Solana escrow.
✅ Reads the secret from Solana logs once the taker claims.
✅ Uses the secret to withdraw tokens from Ethereum.


## Example Flow

1. User creates a swap intent off-chain
User wants to swap ETH (Ethereum) for USDC (Solana).

They generate a random secret, compute hashlock = sha256(secret), and sign an order.

This signed order is sent to a Resolver.

2. Resolver locks tokens on both chains
🔒 On Ethereum (Source Chain):
Fills the order using 1inch Limit Order Protocol.

This creates an EscrowSrc clone contract holding the user’s ETH, governed by:

hashlock
timelock

safety deposit (in FLOW)

🔒 On Solana (Destination Chain):
Deploys a corresponding EscrowDst (via PDA or clone).

Deposits USDC into the Solana escrow (not minting it!).

This escrow uses the same hashlock and timelock.

✅ Now, both escrows are live, fully collateralized on both chains.

3. User reveals the secret to claim funds on Solana
Calls claim(secret) on Solana HTLC.

If sha256(secret) matches the hashlock, funds (USDC) are transferred to the user.

The secret becomes public (either in logs or account data).

4. Resolver reuses the secret to claim on Ethereum
The revealed secret is picked up off-chain.

Resolver uses withdrawTo(secret) on EscrowSrc to claim ETH on Ethereum.

✅ Swap is now fully executed across chains, without moving tokens between chains directly.

```
sequenceDiagram
    participant M as Maker (Flow)
    participant F as Flow Escrow
    participant T as Taker (Solana)
    participant S as Solana Escrow

    M->>F: 1. Deposit tokens (with hash time lock)
    T->>S: 2. Deposit tokens to Swap (with hash time lock)
    T->>F: 3. Withdraw using secret
    M->>S: 4. Withdraw using secret
```


## Functions to call for Maker
- create order offchain
- generate secret
- create escrow ethereum
- deposit tokenA ethereum
- withdraw tokenB solana

## Functions to call for Taker
- create escrow solana
- deposit tokenB solana
- withdraw tokenA on ethereum
- Cancel for maker
- Cancel for taker

The Hash Time lock is implemented