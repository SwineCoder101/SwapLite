import { ethers } from 'ethers';
import { Connection, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface WalletConfig {
  ethereum: {
    privateKey: string;
    rpcUrl: string;
  };
  solana: {
    privateKey: string;
    rpcUrl: string;
  };
}

export class WalletManager {
  private config: WalletConfig;
  private ethereumWallet: ethers.Wallet | null = null;
  private solanaWallet: Keypair | null = null;

  constructor() {
    this.config = {
      ethereum: {
        privateKey: process.env.ETH_PRIVATE_KEY || '',
        rpcUrl: process.env.ETH_RPC_URL || '',
      },
      solana: {
        privateKey: process.env.SOL_PRIVATE_KEY || '',
        rpcUrl: process.env.SOL_RPC_URL || '',
      },
    };
  }

  public initializeEthereumWallet(): ethers.Wallet {
    if (!this.config.ethereum.privateKey) {
      throw new Error('Ethereum private key not found in environment variables');
    }

    if (!this.config.ethereum.rpcUrl) {
      throw new Error('Ethereum RPC URL not found in environment variables');
    }

    const provider = new ethers.JsonRpcProvider(this.config.ethereum.rpcUrl);
    this.ethereumWallet = new ethers.Wallet(this.config.ethereum.privateKey, provider);
    return this.ethereumWallet;
  }

  public initializeSolanaWallet(): Keypair {
    if (!this.config.solana.privateKey) {
      throw new Error('Solana private key not found in environment variables');
    }

    if (!this.config.solana.rpcUrl) {
      throw new Error('Solana RPC URL not found in environment variables');
    }

    // Convert private key from base58 string to Uint8Array
    const privateKeyBytes = Buffer.from(this.config.solana.privateKey, 'base64');
    this.solanaWallet = Keypair.fromSecretKey(privateKeyBytes);
    return this.solanaWallet;
  }

  public getEthereumWallet(): ethers.Wallet {
    if (!this.ethereumWallet) {
      return this.initializeEthereumWallet();
    }
    return this.ethereumWallet;
  }

  public getSolanaWallet(): Keypair {
    if (!this.solanaWallet) {
      return this.initializeSolanaWallet();
    }
    return this.solanaWallet;
  }

  public static saveWalletToFile(walletData: any, filename: string): void {
    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(walletData, null, 2));
  }

  public static loadWalletFromFile(filename: string): any {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Wallet file ${filename} not found`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
} 