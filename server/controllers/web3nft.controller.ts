import { Request, Response } from "express";
import { z } from "zod";
import {
  CreateNftService,
  MintProductNftService,
  EditNftService,
  NFTDataInput,
  NFTMintInput,
  NFTUpdateInput,
} from "../services/web3nft.service";

/* ------------------------------ Schemas ------------------------------ */

const nftDataSchema = z.object({
  name: z.string().min(1, "name is required"),
  quantity: z.number().int().positive(),
  memo: z.string().optional(),
  autoRenewAccountId: z.string().optional(),
  autoRenewPeriodSeconds: z.number().int().positive().optional(),
});

const nftMintSchema = z.object({
  name: z.string().min(1, "name is required"),
  countryOfOrigin: z.string().optional(),
  pricePerUnit: z.number().finite().optional(),
  hsCode: z.union([z.string(), z.number()]).optional(),
  quantity: z.number().int().positive(),
});

const nftUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  symbol: z.string().min(1).optional(),
  memo: z.string().optional(),
  autoRenewAccountId: z.string().optional(),
  autoRenewPeriodSeconds: z.number().int().positive().optional(),
});

/* ------------------------------ Helpers ------------------------------ */

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const res = schema.safeParse(data);
  if (!res.success) {
    const details = res.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    const err = new Error(`Validation failed: ${details}`);
    // @ts-ignore
    err.status = 400;
    throw err;
  }
  return res.data;
}

function sendOk(res: Response, payload: unknown) {
  return res.status(200).json({ ok: true, ...((payload ?? {}) as object) });
}

/* --------------------------------- Ctrl --------------------------------- */

export const ProductNftController = {
  /**
   * POST /api/nfts
   * Body:
   * {
   *   data: NFTDataInput,
   *   mintInput?: NFTMintInput
   * }
   */
  async create(req: Request, res: Response) {
    const data = parse<NFTDataInput>(nftDataSchema, req.body?.data);
    const mintInput = req.body?.mintInput
      ? parse<NFTMintInput>(nftMintSchema, req.body.mintInput)
      : undefined;

    const result = await CreateNftService.createFull(data, mintInput);
    return sendOk(res, { tokenId: result.tokenId, serials: result.serials });
  },

  /**
   * POST /api/nfts/:tokenId/mint
   * Body: NFTMintInput
   */
  async mint(req: Request, res: Response) {
    const { tokenId } = req.params;
    const input = parse<NFTMintInput>(nftMintSchema, req.body);
    const serials = await MintProductNftService.mint(tokenId, input);
    return sendOk(res, { tokenId, serials });
  },

  /**
   * PATCH /api/nfts/:tokenId
   * Body: NFTUpdateInput
   */
  async update(req: Request, res: Response) {
    const { tokenId } = req.params;
    const updates = parse<NFTUpdateInput>(nftUpdateSchema, req.body);
    const result = await EditNftService.updateByTokenId(tokenId, updates);
    return sendOk(res, { tokenId: result.tokenId });
  },
};
