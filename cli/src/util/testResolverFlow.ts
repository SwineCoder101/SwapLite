import { Resolver } from "./resolver"
import Sdk, { NetworkEnum, Address, CrossChainOrderInfo, EscrowParams, Details, HashLock, TimeLocks, EscrowFactory } from '@1inch/cross-chain-sdk'

const srcEscrowFactory = "0x52A42530BE1d23f7753446461c4A214683818eB8";
const dstEscrowFactory = "0x52A42530BE1d23f7753446461c4A214683818eB8";

const srcChainId = 545; // Flow testnet

const escrowFactory = new EscrowFactory(new Address(srcEscrowFactory));


escrowFactory.getSrcEscrowAddress();

// Create order info
const orderInfo: CrossChainOrderInfo = {
    maker: new Address("0x0000000000000000000000000000000000000000"), // maker address
    makerAsset: new Address("0x0000000000000000000000000000000000000000"), // source token address
    takerAsset: new Address("0x0000000000000000000000000000000000000000"), // destination token address
    makingAmount: BigInt("1000000000000000000"), // 1 token
    takingAmount: BigInt("1000000000000000000"), // 1 token
    receiver: new Address("0x0000000000000000000000000000000000000000"), // receiver address
    auctionEndTime: BigInt(Math.floor(Date.now() / 1000) + 1800), // 30 minutes from now
    nonce: BigInt(1),
    partialFillAllowed: false,
    multipleFillsAllowed: false
}

// Create escrow parameters
const escrowParams: EscrowParams = {
    dstChainId: NetworkEnum.ZKSYNC,
    srcSafetyDeposit: BigInt("100000000000000000"), // 0.1 native token
    dstSafetyDeposit: BigInt("100000000000000000"),
    hashLock: new HashLock('0x0000000000000000000000000000000000000000000000000000000000000000'),
    srcChainId: NetworkEnum.ETHEREUM,
    timeLocks: new TimeLocks({
        withdrawal: 300,
        publicWithdrawal: 600,
        cancellation: 900,
        publicCancellation: 1200
    })
}

// Create order details
const details: Details = {
    salt: BigInt(Math.floor(Math.random() * 1000000))
}

// Create the cross-chain order
const order = Sdk.CrossChainOrder.new(
    new Address(srcEscrowFactory),
    orderInfo,
    escrowParams,
    details
);

const resolver = new Resolver(
    srcEscrowFactory,
    dstEscrowFactory
)

// Deploy source escrow
resolver.deploySrc(
    srcChainId, 
    order,
    {
        srcToken: "0x0000000000000000000000000000000000000000",
        dstToken: "0x0000000000000000000000000000000000000000", 
        srcAmount: "0x0000000000000000000000000000000000000000",
        dstAmount: "0x0000000000000000000000000000000000000000"
    }
);

const {txHash: orderFillHash, blockHash: srcDeployBlock} = await srcChainResolver.send(
    resolverContract.deploySrc(
        srcChainId,
        order,
        signature,
        Sdk.TakerTraits.default()
            .setExtension(order.extension)
            .setAmountMode(Sdk.AmountMode.maker)
            .setAmountThreshold(order.takingAmount),
        fillAmount
    )
)