#!/bin/bash

# Load environment variables from .env file
source .env

# Set variables
RPC_URL=$FLOW_RPC_URL
VERIFIER_URL=$VERIFIER_URL_BLOCKSCOUT
CONTRACT_FILE="src/WalletRegistry.sol"
CONTRACT_NAME="WalletRegistry"

# Function to deploy and verify the contract using forge script
deploy_script() {
  echo "Deploying contract using forge script..."
  forge script script/DeployEscrowFactory.s.sol:DeployEscrowFactory \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    --verify \
    --verifier blockscout \
    --legacy \
    --verifier-url $VERIFIER_URL \
    --skip-simulation \

  if [ $? -ne 0 ]; then
    echo "Error: Contract deployment using forge script failed."
    exit 1
  fi
}

# Deploy the contract using forge script
deploy_script

echo "Deployment and verification completed successfully."