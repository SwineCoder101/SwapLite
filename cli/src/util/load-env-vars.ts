import 'dotenv/config';
import { Chain } from 'viem';

export interface EnvVars {
  TAKER_PRIVATE_KEY?: string;
  MAKER_PRIVATE_KEY?: string;
  FLOW_TOKEN_ADDRESS?: string;
  FLOW_ESCROW_ADDRESS?: string;
  FLOW_RPC_URL?: string;
  FLOW_CHAIN_ID?: string;
  MAKER_ADDRESS?: string;
  TAKER_ADDRESS?: string;
  WALLET_ADDRESS?: string;
  RECIPIENT_ADDRESS?: string;
  SOLANA_RPC_URL?: string;
}

export interface ChainConfig {
  chain: Chain;
  chainId: number;
}

export interface LoadedEnvVars extends EnvVars, Partial<ChainConfig> {}

/**
 * Validates required environment variables and returns them if all are present
 * @param requiredVars Object containing the required environment variables
 * @returns Object containing the validated environment variables
 * @throws Error if any required variables are missing
 */
export function validateEnvVars(requiredVars: Partial<EnvVars>): EnvVars {
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables:\n${missingVars.map(varName => `- ${varName}`).join('\n')}`);
  }

  return requiredVars as EnvVars;
}

/**
 * Creates a chain configuration from environment variables
 * @param rpcUrl RPC URL for the network
 * @param chainId Chain ID for the network
 * @returns Chain configuration object
 */
export function createChainConfig(rpcUrl: string, chainId: number): ChainConfig {
  const chain: Chain = {
    id: chainId,
    name: 'custom',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { 
      default: { 
        http: [rpcUrl] 
      },
      public: { 
        http: [rpcUrl] 
      }
    },
    blockExplorers: {
      default: {
        name: 'Custom Explorer',
        url: ''
      }
    }
  };

  return { chain, chainId };
}

/**
 * Loads and validates environment variables for a specific script
 * @param requiredVars Object containing the required environment variables
 * @returns Object containing the validated environment variables and chain configuration
 */
export function loadEnvVars(requiredVars: Partial<EnvVars>): LoadedEnvVars {
  const envVars = validateEnvVars(requiredVars);
  
  if (envVars.FLOW_RPC_URL && envVars.FLOW_CHAIN_ID) {
    const chainConfig = createChainConfig(
      envVars.FLOW_RPC_URL,
      Number(envVars.FLOW_CHAIN_ID)
    );
    return { ...envVars, ...chainConfig };
  }

  return envVars;
}

// Example usage:
/*
import { loadEnvVars } from './load_env_vars';

const { chain, chainId, TOKEN_ADDRESS, WALLET_ADDRESS } = loadEnvVars({
  TOKEN_ADDRESS: process.env.TOKEN_ADDRESS,
  WALLET_ADDRESS: process.env.WALLET_ADDRESS,
  RPC_URL: process.env.RPC_URL,
  CHAIN_ID: process.env.CHAIN_ID,
});
*/
