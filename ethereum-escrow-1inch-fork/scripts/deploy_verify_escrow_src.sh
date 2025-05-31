#!/bin/bash

# Load environment variables
source .env

# Check if required environment variables are set
if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo "Error: DEPLOYER_PRIVATE_KEY is not set in .env file"
    exit 1
fi

if [ -z "$FLOW_RPC_URL" ]; then
    echo "Error: FLOW_RPC_URL is not set in .env file"
    exit 1
fi

# Deploy the contract using forge script
echo "Deploying EscrowSrc contract..."
forge script script/DeployEscrowSrc.s.sol:DeployEscrowSrc \
    --rpc-url $FLOW_RPC_URL \
    --broadcast \
    --verify \
    --etherscan-api-key $FLOWSCAN_API_KEY \
    --verifier-url https://blockscout.com/flow/api \
    --verifier blockscout \
    -vvvv

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo "EscrowSrc contract deployed and verified successfully!"
else
    echo "Error: Contract deployment or verification failed"
    exit 1
fi
