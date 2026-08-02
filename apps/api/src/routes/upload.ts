import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import rateLimit from "express-rate-limit";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { deleteFromR2, uploadToR2 } from "../lib/r2.js";
import { z } from "zod";

export const uploadRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Apenas arquivos de imagem são permitidos"));
    }
    cb(null, true);
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

uploadRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "editor"),
  uploadLimiter,
  upload.array("images", 10),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) throw new HttpError(400, "Nenhuma imagem enviada");

    const results = await Promise.all(
      files.map(async (file) => {
        const compressed = await sharp(file.buffer)
          .rotate()
          .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();

        return uploadToR2(compressed, "image/webp");
      })
    );

    res.status(201).json({ images: results });
  })
);

const deleteSchema = z.object({ key: z.string().min(1) });

uploadRouter.delete(
  "/",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const { key } = deleteSchema.parse(req.body);
    await deleteFromR2(key);
    res.status(204).send();
  })
);
