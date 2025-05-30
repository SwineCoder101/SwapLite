# SwapLite
A Lite SDK for cross chain swaps between ethereum and solana


Example Flow

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

safety deposit (in ETH)

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