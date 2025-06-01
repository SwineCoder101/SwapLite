import 'dotenv/config';
import fs from 'fs';
import { parseEther, formatEther, Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { abi as erc20Abi } from '../abi/ERC20True.json';
import { loadEnvVars } from '../util/load-env-vars';
import crypto from 'crypto';
import { FlowEscrowClient, Immutables } from '../sdk/flow-escrow-client';
import { createPublicClient, http } from 'viem';
import { SolanaEscrowClient } from '../sdk/solana-escrow-client'; // Import Solana escrow client
import { PublicKey, Keypair } from '@solana/web3.js';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection } from '@solana/web3.js';
import { Escrow } from '../idl/escrow';
import * as anchor from '@coral-xyz/anchor';

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

function solanaKeypairFromPrivateKey(privateKey: string): Keypair {
  const secretKey = Uint8Array.from(Buffer.from(privateKey, 'base64'));
  return Keypair.fromSecretKey(secretKey);
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
    SOLANA_RPC_URL,
    SOLANA_ESCROW_PROGRAM_ID,
    TAKER_PRIVATE_KEY_SOLANA,
    MAKER_ADDRESS_SOLANA,
    TOKEN_A_ADDRESS_SOLANA,
    TOKEN_B_ADDRESS_SOLANA,
    TAKER_PRIVATE_KEY_FLOW
  } = loadEnvVars({
    FLOW_TOKEN_ADDRESS: process.env.FLOW_TOKEN_ADDRESS,
    FLOW_ESCROW_ADDRESS: process.env.FLOW_ESCROW_ADDRESS,
    FLOW_RPC_URL: process.env.FLOW_RPC_URL,
    FLOW_CHAIN_ID: process.env.FLOW_CHAIN_ID,
    MAKER_PRIVATE_KEY: process.env.MAKER_PRIVATE_KEY,
    MAKER_ADDRESS: process.env.MAKER_ADDRESS,
    TAKER_ADDRESS: process.env.TAKER_ADDRESS,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    SOLANA_ESCROW_PROGRAM_ID: process.env.SOLANA_ESCROW_PROGRAM_ID,
    TAKER_PRIVATE_KEY_SOLANA: process.env.TAKER_PRIVATE_KEY_SOLANA,
    MAKER_ADDRESS_SOLANA: process.env.MAKER_ADDRESS_SOLANA,
    TOKEN_A_ADDRESS_SOLANA: process.env.TOKEN_A_ADDRESS_SOLANA,
    TOKEN_B_ADDRESS_SOLANA: process.env.TOKEN_B_ADDRESS_SOLANA,
    TAKER_PRIVATE_KEY_FLOW: process.env.TAKER_PRIVATE_KEY_FLOW
  });

  // ====================== FLOW PART ======================
  const makerAccount = privateKeyToAccount(`0x${MAKER_PRIVATE_KEY}`);
  const tokenAddress = FLOW_TOKEN_ADDRESS as Address;
  const escrowAddress = FLOW_ESCROW_ADDRESS as Address;
  const makerAddr = MAKER_ADDRESS as Address;
  const takerAsBigInt = toBigIntFromSolanaPubkey(TAKER_ADDRESS!);

  const makerEscrowClient = new FlowEscrowClient({
    contractAddress: escrowAddress,
    rpcUrl: FLOW_RPC_URL || '',
    privateKey: `0x${MAKER_PRIVATE_KEY}`,
    chainId: parseInt(FLOW_CHAIN_ID!),
  });

  const publicClient = makerEscrowClient.publicClient;

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
    immutables: {
      ...immutables,
      maker: immutables.maker.toString(),
      taker: immutables.taker.toString(),
      token: immutables.token.toString(),
      amount: immutables.amount.toString(),
      safetyDeposit: immutables.safetyDeposit.toString(),
      timelocks: immutables.timelocks.toString()
    }
  }, null, 2));

  console.log('🔍 Checking initial state...');
  const state = await getSwapState(publicClient, tokenAddress, escrowAddress, makerAddr);
  printState(state, 'initial');

  console.log('🚀 Maker depositing to Flow escrow...');
  await makerEscrowClient.deposit(amount, immutables);

  const updatedState = await getSwapState(publicClient, tokenAddress, escrowAddress, makerAddr);
  printState(updatedState, 'after deposit');

  // ====================== SOLANA PART ======================
  console.log('🔑 Initializing Solana taker...');
  const connection = new Connection(SOLANA_RPC_URL || '', 'confirmed');
  const takerKeypair = solanaKeypairFromPrivateKey(TAKER_PRIVATE_KEY_SOLANA!);
  const provider = new AnchorProvider(connection, new (class {} as any), {});
  const solanaEscrowClient = new SolanaEscrowClient(provider);
  const seed = new anchor.BN(1); // Use actual order seed in production

  console.log('🚀 Taker depositing to Solana escrow...');
  await solanaEscrowClient.takeEscrow(
    takerKeypair,
    new PublicKey(MAKER_ADDRESS_SOLANA!),
    new PublicKey(TOKEN_A_ADDRESS_SOLANA!),
    new PublicKey(TOKEN_B_ADDRESS_SOLANA!),
    new PublicKey(MAKER_ADDRESS_SOLANA!), // Maker's Solana ATA for token B
    seed,
    new anchor.BN(amount.toString())
  );

  // ====================== WITHDRAWAL PHASE ======================
  console.log('🔓 Reading secret for withdrawal...');
  const secretData = JSON.parse(fs.readFileSync('./shared-secret.json', 'utf-8'));
  const withdrawalSecret = secretData.secret as Hex;

  console.log('🔄 Taker withdrawing from Flow escrow...');
  const takerEscrowClient = new FlowEscrowClient({
    contractAddress: escrowAddress,
    rpcUrl: FLOW_RPC_URL || '',
    privateKey: `0x${TAKER_PRIVATE_KEY_FLOW}`,
    chainId: parseInt(FLOW_CHAIN_ID!),
  });

  const takerImmutables: Immutables = {
    ...immutables,
    taker: BigInt(secretData.immutables.taker) // Use taker's Flow address
  };

  await takerEscrowClient.withdraw(withdrawalSecret, takerImmutables);

  console.log('✅ Cross-chain swap completed successfully!');
}

main().catch((err) => {
  console.error('❌ Error occurred:', err);
  process.exit(1);
});