import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
export async function createShortUrl(req, res) {
  const { url, expiry } = req.body;
  if (!url) return res.status(400).send("URL required");

  const shortId = uuidv4().slice(0, 6);
  const userId = req.cookies.user_id;

  const expiryMap = {
    "1m": 1,
    "5m": 5,
    "30m": 30,
    "1h": 60,
    "5h": 300
  };
  const minutes = expiryMap[expiry] || 60;
  const expiresAt = new Date(Date.now() + minutes * 60000);

  try {
    await pool.query(
      "INSERT INTO urls (short_id, original_url, expires_at, user_id) VALUES ($1, $2, $3, $4)",
      [shortId, url, expiresAt, userId]
    );

    const shortUrl = `${req.protocol}://${req.get("host")}/${shortId}`;

const qrCode = await QRCode.toDataURL(url);

    res.render("result", { shortUrl, expiresAt, qrCode, shortId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
}

export async function redirectShortUrl(req, res) {
  const { shortId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM urls WHERE short_id = $1",
      [shortId]
    );

    if (result.rows.length === 0) return res.status(404).send("Not found");

    const record = result.rows[0];
    const now = new Date();

    if (now > record.expires_at) {
      return res.status(410).send("Link expired");
    }

    await pool.query(
      "UPDATE urls SET clicks = clicks + 1 WHERE short_id = $1",
      [shortId]
    );

    res.redirect(record.original_url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}


export async function listAllShortened(req, res) {
  try {
    const result = await pool.query(
      "SELECT short_id, original_url, expires_at FROM urls ORDER BY created_at DESC NULLS LAST"
    );

    const urls = result.rows.map(r => ({
      shortUrl: `https://short.link/${r.short_id}`,
      original: r.original_url,
      expiresAt: r.expires_at ? new Date(r.expires_at).toLocaleString() : 'never'
    }));

    res.render('shortened', { urls });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}




export async function getAllUrls(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM urls"
    );
    const urls = result.rows;

    res.render("list", { urls, shortId: "example-short-id" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
}