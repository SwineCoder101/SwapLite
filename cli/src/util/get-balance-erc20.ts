import 'dotenv/config';
import { createPublicClient, http, formatEther } from 'viem';
import { abi as erc20Abi } from '../abi/ERC20True.json';
import { Address } from 'viem';
import { loadEnvVars } from './load-env-vars';

async function main() {
  const { chain, TOKEN_ADDRESS, WALLET_ADDRESS } = loadEnvVars({
    TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS,
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  console.log('Fetching token balance...');
  console.log(`Token Address: ${TOKEN_ADDRESS}`);
  console.log(`Wallet Address: ${WALLET_ADDRESS}`);

  const balance = await publicClient.readContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [WALLET_ADDRESS as Address],
  }) as bigint;

  console.log('✅ Balance retrieved!');
  console.log(`Balance: ${formatEther(balance)} tokens`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
