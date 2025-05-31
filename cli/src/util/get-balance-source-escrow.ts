import 'dotenv/config';
import { createPublicClient, http, formatEther } from 'viem';
import { abi as erc20Abi } from '../abi/ERC20True.json';
import { abi as escrowAbi } from '../abi/EscrowSrc.json';
import { Address } from 'viem';
import { loadEnvVars } from './load-env-vars';

async function main() {
  const { chain, TOKEN_ADDRESS, ESCROW_ADDRESS } = loadEnvVars({
    TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    ESCROW_ADDRESS: process.env.ESCROW_ADDRESS,
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  console.log('Fetching escrow balances...');
  console.log(`Token Address: ${TOKEN_ADDRESS}`);
  console.log(`Escrow Address: ${ESCROW_ADDRESS}`);

  // Get the token balance in the escrow contract
  const tokenBalance = await publicClient.readContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [ESCROW_ADDRESS as Address],
  }) as bigint;

  // Get the native token (ETH) balance in the escrow contract
  const nativeBalance = await publicClient.getBalance({
    address: ESCROW_ADDRESS as Address,
  });

  console.log('✅ Balances retrieved!');
  console.log(`Token Balance: ${formatEther(tokenBalance)} tokens`);
  console.log(`Native Balance: ${formatEther(nativeBalance)} ETH`);

  // Get escrow details if available
  try {
    const escrowDetails = await publicClient.readContract({
      address: ESCROW_ADDRESS as Address,
      abi: escrowAbi,
      functionName: 'getEscrowDetails',
    });

    console.log('\nEscrow Details:');
    console.log(JSON.stringify(escrowDetails, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    , 2));
  } catch (error) {
    console.log('\nNote: Could not fetch escrow details. The contract might not have this function.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
