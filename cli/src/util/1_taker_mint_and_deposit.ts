import 'dotenv/config';
import { createWalletClient, http, parseEther, parseAbi, encodeFunctionData, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as escrowAbi, Immutables } from '../src/escrowClient';
import { abi as erc20Abi } from '../src/erc20Abi'; // standard ERC20 ABI
import { Address } from 'viem';

async function main() {
  const {
    TAKER_PRIVATE_KEY,
    TOKEN_ADDRESS,
    ESCROW_ADDRESS,
    RPC_URL,
    CHAIN_ID,
    MAKER_ADDRESS,
    TAKER_ADDRESS,
  } = process.env;

  if (!TAKER_PRIVATE_KEY || !TOKEN_ADDRESS || !ESCROW_ADDRESS || !RPC_URL || !CHAIN_ID || !MAKER_ADDRESS || !TAKER_ADDRESS) {
    throw new Error('Missing required environment variables.');
  }

  const account = privateKeyToAccount(`0x${TAKER_PRIVATE_KEY}`);
  const chainId = Number(CHAIN_ID);

  const walletClient = createWalletClient({
    account,
    chain: {
      id: chainId,
      name: 'custom',
      network: 'custom',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [RPC_URL] } },
    },
    transport: http(),
  });

  const amount = parseEther('10');
  const safetyDeposit = parseEther('0.01');

  const hashlock = '0x' + crypto.randomUUID().replace(/-/g, '').padEnd(64, '0');
  const orderHash = '0x' + crypto.randomUUID().replace(/-/g, '').padEnd(64, '0');
  const timelock = BigInt(Math.floor(Date.now() / 1000) + 3600 * 4); // 4 hours from now

  const immutables: Immutables = {
    orderHash,
    hashlock,
    maker: BigInt(MAKER_ADDRESS),
    taker: BigInt(TAKER_ADDRESS),
    token: BigInt(TOKEN_ADDRESS),
    amount,
    safetyDeposit,
    timelocks: timelock,
  };

  console.log('1️⃣ Minting tokens to taker...');
  await walletClient.writeContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'mint',
    args: [TAKER_ADDRESS, amount],
  });

  console.log('2️⃣ Approving escrow contract...');
  await walletClient.writeContract({
    address: TOKEN_ADDRESS as Address,
    abi: erc20Abi,
    functionName: 'approve',
    args: [ESCROW_ADDRESS, amount],
  });

  console.log('3️⃣ Depositing to Escrow...');
  await walletClient.writeContract({
    address: ESCROW_ADDRESS as Address,
    abi: escrowAbi,
    functionName: 'deposit',
    args: [amount, immutables],
  });

  console.log('✅ Deposit complete');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
