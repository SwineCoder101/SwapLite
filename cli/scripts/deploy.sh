#!/bin/zsh

set -e # exit on error

# Source the .env file to load the variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

# Define the chain configurations
typeset -A chains
chains["mainnet"]="$MAINNET_RPC_URL"
chains["bsc"]="$BSC_RPC_URL"
chains["polygon"]="$POLYGON_RPC_URL"
chains["avalanche"]="$AVALANCHE_RPC_URL"
chains["gnosis"]="$GNOSIS_RPC_URL"
chains["arbitrum"]="$ARBITRUM_RPC_URL"
chains["optimism"]="$OPTIMISM_RPC_URL"
chains["base"]="$BASE_RPC_URL"
chains["zksync"]="$ZKSYNC_RPC_URL"
chains["linea"]="$LINEA_RPC_URL"
chains["sonic"]="$SONIC_RPC_URL"
chains["unichain"]="$UNICHAIN_RPC_URL"
chains["flow"]="$FLOW_RPC_URL"

# Check if chain argument is provided
if [ -z "$1" ]; then
    echo "Please provide a chain name"
    echo "Available chains: ${(k)chains}"
    exit 1
fi

rpc_url="${chains["$1"]}"
if [ -z "$rpc_url" ]; then
    echo "Chain not found"
    echo "Available chains: ${(k)chains}"
    exit 1
fi

echo "Deploying to chain: $1"
echo "RPC URL: $rpc_url"

# Check if keystore is provided
if [ -z "$2" ]; then
    echo "Please provide a keystore path"
    echo "Usage: ./deploy.sh <chain> <keystore>"
    exit 1
fi

keystore="$HOME/.foundry/keystores/$2"
echo "Keystore: $keystore"
if [ -e "$keystore" ]; then
    echo "Keystore found"
else
    echo "Keystore not found at: $keystore"
    exit 1
fi

# Build the project first
echo "Building project..."
npm run build

# Deploy based on chain type
if [ "$1" = "zksync" ]; then
    echo "Deploying to zkSync..."
    forge script script/DeployEscrowFactoryZkSync.s.sol --zksync --fork-url $rpc_url --keystore $keystore --broadcast -vvvv
elif [ "$1" = "flow" ]; then
    echo "Deploying to Flow..."
    forge script script/DeployEscrowFactoryFlow.s.sol --flow --fork-url $rpc_url --keystore $keystore --broadcast -vvvv
else
    echo "Deploying to $1..."
    forge script script/DeployEscrowFactory.s.sol --fork-url $rpc_url --keystore $keystore --broadcast -vvvv
fi 