import express from "express";
import { createShortUrl, redirectShortUrl, listUserLinks } from "../controllers/urlController.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.get("/all", listUserLinks);  
router.get("/:shortId", redirectShortUrl);

export default router;
