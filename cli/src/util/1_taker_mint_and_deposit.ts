import 'dotenv/config';
import { createWalletClient, http, parseEther, parseAbi, encodeFunctionData, zeroAddress, Hex, Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Immutables } from '../sdk/EscrowSrcClient';
import { abi as erc20Abi } from '../abi/ERC20True.json'; // standard ERC20 ABI
import { abi as escrowAbi } from '../abi/EscrowSrc.json';
import { Address } from 'viem';

async function main() {
  const requiredEnvVars = {
    MAKER_PRIVATE_KEY: process.env.MAKER_PRIVATE_KEY,
    FLOW_TOKEN_ADDRESS: process.env.FLOW_TOKEN_ADDRESS,
    FLOW_ESCROW_ADDRESS: process.env.FLOW_ESCROW_ADDRESS,
    FLOW_RPC_URL: process.env.FLOW_RPC_URL,
    FLOW_CHAIN_ID: process.env.FLOW_CHAIN_ID,
    MAKER_ADDRESS: process.env.MAKER_ADDRESS,
    TAKER_ADDRESS: process.env.TAKER_ADDRESS,
  } as const;

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables:\n${missingVars.map(varName => `- ${varName}`).join('\n')}`);
  }

  const {
    MAKER_PRIVATE_KEY,
    FLOW_TOKEN_ADDRESS,
    FLOW_ESCROW_ADDRESS,
    FLOW_RPC_URL,
    FLOW_CHAIN_ID,
    MAKER_ADDRESS,
    TAKER_ADDRESS,
  } = process.env;

  const account = privateKeyToAccount(`0x${MAKER_PRIVATE_KEY}`);
  const chainId = Number(FLOW_CHAIN_ID);

  const chain: Chain = {
    id: chainId,
    name: 'custom',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { 
      default: { 
        http: [FLOW_RPC_URL!] 
      },
      public: { 
        http: [FLOW_RPC_URL!] 
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

  const amount = parseEther('10');
  const safetyDeposit = parseEther('0.01');

  const hashlock = '0x' + crypto.randomUUID().replace(/-/g, '').padEnd(64, '0') as Hex;
  const orderHash = '0x' + crypto.randomUUID().replace(/-/g, '').padEnd(64, '0') as Hex;
  const timelock = BigInt(Math.floor(Date.now() / 1000) + 3600 * 4); // 4 hours from now

  const immutables: Immutables = {
    orderHash,
    hashlock,
    maker: BigInt(MAKER_ADDRESS!),
    taker: BigInt(TAKER_ADDRESS!),
    token: BigInt(FLOW_TOKEN_ADDRESS!),
    amount,
    safetyDeposit,
    timelocks: timelock,
  };

  console.log('1️⃣ Minting tokens to taker...');
  await walletClient.writeContract({
    address: FLOW_TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'mint',
    args: [TAKER_ADDRESS, amount],
    chain,
  });

  console.log('2️⃣ Approving escrow contract...');
  await walletClient.writeContract({
    address: FLOW_TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'approve',
    args: [FLOW_ESCROW_ADDRESS, amount],
    chain,
  });

  console.log('3️⃣ Depositing to Escrow...');
  await walletClient.writeContract({
    address: FLOW_ESCROW_ADDRESS as Address,
    abi: escrowAbi,
    functionName: 'deposit',
    args: [amount, immutables],
    chain,
  });

  console.log('✅ Deposit complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
