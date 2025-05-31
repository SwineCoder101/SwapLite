import 'dotenv/config';
import fs from 'fs';
import { parseEther, formatEther, Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as erc20Abi } from '../abi/ERC20True.json';
import { loadEnvVars } from '../util/load-env-vars';
import crypto from 'crypto';
import { EscrowSrcClient, Immutables } from '../sdk/escrow-src-client';
import { createPublicClient, http } from 'viem';

interface SwapState {
  makerTokenBalance: bigint;
  makerNativeBalance: bigint;
  escrowTokenBalance: bigint;
  escrowNativeBalance: bigint;
}

function toBigIntFromSolanaPubkey(pubkey: string): bigint {
  const hex = Buffer.from(pubkey, 'utf8').toString('hex').padEnd(64, '0');
  return BigInt(`0x${hex}`);
}

async function getSwapState(
  publicClient: ReturnType<typeof createPublicClient>,
  tokenAddress: Address,
  escrowAddress: Address,
  makerAddress: Address
): Promise<SwapState> {
  const [
    makerTokenBalance,
    escrowTokenBalance,
    makerNativeBalance,
    escrowNativeBalance
  ] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [makerAddress],
    }),
    publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [escrowAddress],
    }),
    publicClient.getBalance({ address: makerAddress }),
    publicClient.getBalance({ address: escrowAddress }),
  ]);

  return {
    makerTokenBalance: makerTokenBalance as bigint,
    makerNativeBalance,
    escrowTokenBalance: escrowTokenBalance as bigint,
    escrowNativeBalance,
  };
}

function printState(state: SwapState, step: string) {
  console.log(`\n📊 State after ${step}:`);
  console.log('----------------------------------------');
  console.log(`Maker Token Balance: ${formatEther(state.makerTokenBalance)} tokens`);
  console.log(`Maker Native Balance: ${formatEther(state.makerNativeBalance)} ETH`);
  console.log(`Escrow Token Balance: ${formatEther(state.escrowTokenBalance)} tokens`);
  console.log(`Escrow Native Balance: ${formatEther(state.escrowNativeBalance)} ETH`);
  console.log('----------------------------------------\n');
}

async function main() {
  const {
    FLOW_TOKEN_ADDRESS,
    FLOW_ESCROW_ADDRESS,
    FLOW_RPC_URL,
    FLOW_CHAIN_ID,
    MAKER_PRIVATE_KEY,
    MAKER_ADDRESS,
    TAKER_ADDRESS,
  } = loadEnvVars({
    FLOW_TOKEN_ADDRESS: process.env.FLOW_TOKEN_ADDRESS,
    FLOW_ESCROW_ADDRESS: process.env.FLOW_ESCROW_ADDRESS,
    FLOW_RPC_URL: process.env.FLOW_RPC_URL,
    FLOW_CHAIN_ID: process.env.FLOW_CHAIN_ID,
    MAKER_PRIVATE_KEY: process.env.MAKER_PRIVATE_KEY,
    MAKER_ADDRESS: process.env.MAKER_ADDRESS,
    TAKER_ADDRESS: process.env.TAKER_ADDRESS,
  });

  const makerAccount = privateKeyToAccount(`0x${MAKER_PRIVATE_KEY}`);
  const tokenAddress = FLOW_TOKEN_ADDRESS as Address;
  const escrowAddress = FLOW_ESCROW_ADDRESS as Address;
  const makerAddr = MAKER_ADDRESS as Address;
  const takerAsBigInt = toBigIntFromSolanaPubkey(TAKER_ADDRESS!);

  const escrowClient = new EscrowSrcClient({
    contractAddress: escrowAddress,
    rpcUrl: FLOW_RPC_URL || '',
    privateKey: `0x${MAKER_PRIVATE_KEY}`,
    chainId: parseInt(FLOW_CHAIN_ID!),
  });

  const publicClient = escrowClient.publicClient;

  const amount = parseEther('10');
  const safetyDeposit = parseEther('0.01');
  const timelock = BigInt(Math.floor(Date.now() / 1000) + 3600 * 4);

  const secret = crypto.randomBytes(32);
  const hashlock: Hex = `0x${Buffer.from(secret).toString('hex')}`;
  const orderHash: Hex = `0x${crypto.randomBytes(32).toString('hex')}`;

  const immutables: Immutables = {
    orderHash,
    hashlock,
    maker: BigInt(makerAddr),
    taker: takerAsBigInt,
    token: BigInt(tokenAddress),
    amount,
    safetyDeposit,
    timelocks: timelock,
  };

  console.log('📤 Saving secret and hashlock for taker...');
  fs.writeFileSync('./shared-secret.json', JSON.stringify({
    secret: `0x${Buffer.from(secret).toString('hex')}`,
    hashlock,
    orderHash,
    timelock: timelock.toString(),
  }, null, 2));

  console.log('🔍 Checking initial state...');
  const state = await getSwapState(publicClient, tokenAddress, escrowAddress, makerAddr);
  printState(state, 'initial');

  console.log('🚀 Maker depositing to escrow...');
  await escrowClient.deposit(amount, immutables);

  const updatedState = await getSwapState(publicClient, tokenAddress, escrowAddress, makerAddr);
  printState(updatedState, 'after deposit');

  console.log('✅ Maker flow complete. Awaiting taker action on Solana.');
}

main().catch((err) => {
  console.error('❌ Error occurred:', err);
  process.exit(1);
});
