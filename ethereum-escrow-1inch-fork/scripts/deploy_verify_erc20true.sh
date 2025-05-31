#!/bin/bash

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "Error: DEPLOYER_PRIVATE_KEY is not set in .env file"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL is not set in .env file"
    exit 1
fi

if [ -z "$BLOCKSCOUT_API_KEY" ]; then
    echo "Error: BLOCKSCOUT_API_KEY is not set in .env file"
    exit 1
fi

# Deploy the contract using forge script
echo "Deploying ERC20True contract..."
forge script script/DeployERC20True.s.sol:DeployERC20True \
    --rpc-url $RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $BLOCKSCOUT_API_KEY \
    --verifier-url https://blockscout.com/api \
    --verifier blockscout \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "ERC20True contract deployed and verified successfully!"
else
    echo "Error: Contract deployment or verification failed"
    exit 1
fi 