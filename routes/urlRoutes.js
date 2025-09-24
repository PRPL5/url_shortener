import express from "express";
import { createShortUrl, redirectShortUrl, getAllUrls } from "../controllers/urlController.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.get("/all", getAllUrls);  
router.get("/:shortId", redirectShortUrl);

export default router;
