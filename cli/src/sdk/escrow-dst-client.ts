import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Escrow } from "../idl/escrow";

export class EscrowClient {
  readonly program: Program<Escrow>;
  readonly provider: anchor.AnchorProvider;

  constructor(provider: anchor.AnchorProvider) {
    this.provider = provider;
    anchor.setProvider(provider);
    this.program = anchor.workspace.Escrow as Program<Escrow>;
  }

  async deriveEscrowPDA(maker: PublicKey, seed: BN): Promise<[PublicKey, number]> {
    return await PublicKey.findProgramAddress(
      [Buffer.from("escrow"), maker.toBuffer(), seed.toArrayLike(Buffer, "le", 8)],
      this.program.programId
    );
  }

  async deriveVaultPDA(escrowPDA: PublicKey, mintA: PublicKey): Promise<PublicKey> {
    return await getAssociatedTokenAddress(mintA, escrowPDA, true, TOKEN_PROGRAM_ID);
  }

  async makeEscrow(
    maker: anchor.web3.Keypair,
    mintA: PublicKey,
    mintB: PublicKey,
    seed: BN,
    deposit: BN,
    receive: BN
  ) {
    const [escrowPDA, bump] = await this.deriveEscrowPDA(maker.publicKey, seed);
    const makerAtaA = await getAssociatedTokenAddress(mintA, maker.publicKey);
    const vault = await this.deriveVaultPDA(escrowPDA, mintA);

    await this.program.methods
      .make(seed, deposit, receive, bump)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerAtaA,
        escrow: escrowPDA,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    return { escrowPDA, vault };
  }

  async takeEscrow(
    taker: anchor.web3.Keypair,
    maker: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    makerAtaB: PublicKey,
    seed: BN,
    amount: BN
  ) {
    const [escrowPDA] = await this.deriveEscrowPDA(maker, seed);
    const vault = await this.deriveVaultPDA(escrowPDA, mintA);

    const takerAtaA = await getAssociatedTokenAddress(mintA, taker.publicKey);
    const takerAtaB = await getAssociatedTokenAddress(mintB, taker.publicKey);

    await this.program.methods
      .take(amount)
      .accountsPartial({
        taker: taker.publicKey,
        maker,
        mintA,
        mintB,
        takerAtaA,
        takerAtaB,
        makerAtaB,
        escrow: escrowPDA,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc();
  }

  async refundEscrow(
    maker: anchor.web3.Keypair,
    mintA: PublicKey,
    seed: BN
  ) {
    const [escrowPDA] = await this.deriveEscrowPDA(maker.publicKey, seed);
    const makerAtaA = await getAssociatedTokenAddress(mintA, maker.publicKey);
    const vault = await this.deriveVaultPDA(escrowPDA, mintA);

    await this.program.methods
      .refund()
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        makerAtaA,
        escrow: escrowPDA,
        vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
  }
}
