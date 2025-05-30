// use this when there is no `"type": "module"` in your package.json, i.e. you're using commonjs
import { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } from "@1inch/cross-chain-sdk";
import { Web3 } from 'web3';
import { solidityPackedKeccak256, randomBytes, Contract, Wallet, JsonRpcProvider } from 'ethers';

import dotenv from 'dotenv';

const env = dotenv.config().parsed;
const process = env;


// TODO write formal bug for this function being inaccessible
function getRandomBytes32() {
    // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

const makerPrivateKey = process?.WALLET_KEY;
const makerAddress = process?.WALLET_ADDRESS;
const nodeUrl = process?.RPC_URL; // suggested for ethereum https://eth.llamarpc.com
const devPortalApiKey = process?.DEV_PORTAL_KEY;

// Validate environment variables
if (!makerPrivateKey || !makerAddress || !nodeUrl || !devPortalApiKey) {
    throw new Error("Missing required environment variables. Please check your .env file.");
}

const web3Instance = new Web3(nodeUrl);
const blockchainProvider = new PrivateKeyProviderConnector(makerPrivateKey, web3Instance);

const sdk = new SDK({
    url: 'https://api.1inch.dev/fusion-plus',
    authKey: devPortalApiKey,
    blockchainProvider
});

let srcChainId = NetworkEnum.ARBITRUM;
let dstChainId = NetworkEnum.COINBASE;
let srcTokenAddress = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
let dstTokenAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

const approveABI = [{
    "constant": false,
    "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}];

(async () => {


    const invert = false;

    if (invert) {
        const temp = srcChainId;
        srcChainId = dstChainId;
        dstChainId = temp;

        const tempAddress = srcTokenAddress;
        srcTokenAddress = dstTokenAddress;
        dstTokenAddress = tempAddress;
    }


    // Approve tokens for spending.
    // If you need to approve the tokens before posting an order, this code can be uncommented for first run.
    // const provider = new JsonRpcProvider(nodeUrl);
    // const tkn = new Contract(srcTokenAddress, approveABI, new Wallet(makerPrivateKey, provider));
    // await tkn.approve(
    //     '0x111111125421ca6dc452d289314280a0f8842a65', // aggregation router v6
    //     (2n**256n - 1n) // unlimited allowance
    // );

    const params = {
        srcChainId,
        dstChainId,
        srcTokenAddress,
        dstTokenAddress,
        amount: '1000000000000000000', // Adjust this to the correct decimal precision of the source token
        enableEstimate: true,
        walletAddress: makerAddress
    };

    sdk.getQuote(params).then(quote => {
        const secretsCount = quote.getPreset().secretsCount;

        const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
        const secretHashes = secrets.map(x => HashLock.hashSecret(x));

        const hashLock = secretsCount === 1
            ? HashLock.forSingleFill(secrets[0])
            : HashLock.forMultipleFills(
                secretHashes.map((secretHash, i) => 
                    solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
                )
            );
        console.log("Received Fusion+ quote from 1inch API");
        console.log(quote);
    }).catch((error) => {
        console.dir(error, { depth: null });
    });
})().catch(error => {
    console.error("Error in main execution:", error);
});