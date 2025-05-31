#!/bin/bash

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$ETH_PRIVATE_KEY" ]; then
    echo "Error: ETH_PRIVATE_KEY is not set in .env file"
    exit 1
fi

if [ -z "$FLOW_RPC_URL" ]; then
    echo "Error: RPC_URL is not set in .env file"
    exit 1
fi


# Deploy the contract using forge script
echo "Deploying ERC20True contract..."
forge script script/DeployERC20True.s.sol:DeployERC20True \
    --rpc-url $FLOW_RPC_URL \
    --private-key $ETH_PRIVATE_KEY \
    --broadcast \
    --verify \
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