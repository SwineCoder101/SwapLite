import { createPublicClient, createWalletClient, http } from 'viem';
import { Address, Hex, parseAbiItem } from 'viem';
import { abi } from '../abi/EscrowSrc.json'; // paste ABI here or import from JSON
import { privateKeyToAccount } from 'viem/accounts';

export type Immutables = {
  orderHash: Hex;
  hashlock: Hex;
  maker: bigint;
  taker: bigint;
  token: bigint;
  amount: bigint;
  safetyDeposit: bigint;
  timelocks: bigint;
};

export class EscrowSrcClient {
  publicClient;
  walletClient;
  account;
  contractAddress: Address;

  constructor({
    contractAddress,
    rpcUrl,
    privateKey,
    chainId,
  }: {
    contractAddress: Address;
    rpcUrl: string;
    privateKey: Hex;
    chainId: number;
  }) {
    this.contractAddress = contractAddress;
    this.account = privateKeyToAccount(privateKey);

    this.publicClient = createPublicClient({
      transport: http(rpcUrl),
      chain: { id: chainId, name: 'custom', network: 'custom', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [rpcUrl] } } },
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: this.publicClient.chain,
      transport: http(rpcUrl),
    });
  }

  async deposit(amount: bigint, immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'deposit',
      args: [amount, immutables],
    });
  }

  async withdraw(secret: Hex, immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'withdraw',
      args: [secret, immutables],
    });
  }

  async withdrawTo(secret: Hex, target: Address, immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'withdrawTo',
      args: [secret, target, immutables],
    });
  }

  async publicWithdraw(secret: Hex, immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'publicWithdraw',
      args: [secret, immutables],
    });
  }

  async cancel(immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'cancel',
      args: [immutables],
    });
  }

  async publicCancel(immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'publicCancel',
      args: [immutables],
    });
  }

  async rescueFunds(token: Address, amount: bigint, immutables: Immutables) {
    return this.walletClient.writeContract({
      address: this.contractAddress,
      abi,
      functionName: 'rescueFunds',
      args: [token, amount, immutables],
    });
  }

  async readRescueDelay(): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi,
      functionName: 'RESCUE_DELAY',
    }) as unknown as bigint;
  }

  async readFactory(): Promise<Address> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi,
      functionName: 'FACTORY',
    }) as unknown as Address;
  }

  async readBytecodeHash(): Promise<Hex> {
    return this.publicClient.readContract({
      address: this.contractAddress,
      abi,
      functionName: 'PROXY_BYTECODE_HASH',
    }) as unknown as Hex;
  }
}
