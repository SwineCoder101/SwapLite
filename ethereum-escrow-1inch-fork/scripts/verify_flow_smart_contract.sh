#!/bin/zsh

# Source the .env file to load the variables
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

# Verify the Flow contract
# forge verify-contract \
#   --rpc-url $FLOW_RPC_URL \
#   $FLOW_CONTRACT_ADDRESS \
#   script/DeployEscrowFactoryZkSync.s.sol:DeployEscrowFactoryZkSync \
#   --verifier blockscout \
#   --verifier-url $VERIFIER_URL_BLOCKSCOUT

  forge verify-contract \
  --rpc-url https://testnet.evm.nodes.onflow.org/ \
  --verifier blockscout \
  --verifier-url 'https://evm-testnet.flowscan.io/api/' \
  0x2Da2d32ECdcB7c89B0fC435625b1052cDDae2D5e \
  ./contracts/EscrowSrc.sol:EscrowSrc
#   ./contracts/zkSync/EscrowFactoryZkSync.sol:EscrowFactoryZkSync