import express from "express";
import { createShortUrl, redirectShortUrl, listUserLinks, deleteShortUrl } from "../controllers/urlController.js";

const router = express.Router();

router.post("/shorten", createShortUrl);
router.post("/delete/:shortId", deleteShortUrl);
router.get("/all", listUserLinks);  
router.get("/:shortId", redirectShortUrl);

export default router;
