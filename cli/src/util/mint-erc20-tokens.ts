import 'dotenv/config';
import { createWalletClient, http, parseEther, Hex, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as erc20Abi } from '../abi/ERC20True.json';
import { Address } from 'viem';

async function main() {
  const requiredEnvVars = {
    PRIVATE_KEY: process.env.MAKER_PRIVATE_KEY,
    TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
    RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS,
    RPC_URL: process.env.RPC_URL,
    CHAIN_ID: process.env.CHAIN_ID,
  } as const;

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables:\n${missingVars.map(varName => `- ${varName}`).join('\n')}`);
  }

  const {
    PRIVATE_KEY,
    TOKEN_ADDRESS,
    RECIPIENT_ADDRESS,
    RPC_URL,
    CHAIN_ID,
  } = process.env;

  const account = privateKeyToAccount(`0x${PRIVATE_KEY}`);
  const chainId = Number(CHAIN_ID);

  const chain: Chain = {
    id: chainId,
    name: 'custom',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { 
      default: { 
        http: [RPC_URL!] 
      },
      public: { 
        http: [RPC_URL!] 
      }
    },
    blockExplorers: {
      default: {
        name: 'Custom Explorer',
        url: ''
      }
    }
  };

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  // Amount to mint (10 tokens)
  const amount = parseEther('10');

  console.log('Minting tokens...');
  console.log(`Token Address: ${TOKEN_ADDRESS}`);
  console.log(`Recipient: ${RECIPIENT_ADDRESS}`);
  console.log(`Amount: ${amount} wei`);

  const hash = await walletClient.writeContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'mint',
    args: [RECIPIENT_ADDRESS, amount],
    chain,
  });

  console.log('✅ Mint transaction sent!');
  console.log(`Transaction hash: ${hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
