import pool from "../db.js";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";export async function createShortUrl(req, res) {
  let { url, expiry } = req.body;
  if (!url) return res.status(400).send("URL required");

  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`;
  }

  const shortId = uuidv4().slice(0, 6);
  const userId = req.cookies.user_id;

  const expiryMap = {
    "1m": 1,
    "5m": 5,
    "30m": 30,
    "1h": 60,
    "5h": 300,
  };
  const minutes = expiryMap[expiry] || 60;
  const expiresAt = new Date(Date.now() + minutes * 60000);

  try {
    await pool.query(
      `INSERT INTO urls (short_id, original_url, expires_at, user_id)
       VALUES ($1, $2, $3, $4)`,
      [shortId, url, expiresAt, userId]
    );

    const shortUrl = `${req.protocol}://${req.get("host")}/${shortId}`;
    const qrCode = await QRCode.toDataURL(url);
    console.log("Creating short URL for user:", userId);

    res.redirect('/');
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



export async function listUserLinks(req, res) {
  const userId = req.cookies.user_id;
  console.log("Fetching links for user:", userId);

  try {
    const result = await pool.query(
      `SELECT short_id, original_url, expires_at, clicks
       FROM urls
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const rows = result.rows;
    const rowsWithQr = await Promise.all(rows.map(async (r) => {
      try {
        const qr = await QRCode.toDataURL(r.original_url);
        return { ...r, qr };
      } catch (e) {
        return { ...r, qr: null };
      }
    }));

    res.render("main", { urls: rowsWithQr });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
}


export async function deleteShortUrl(req, res) {
  const { shortId } = req.params;
  const userId = req.cookies.user_id;

  if (!userId) return res.status(403).send('Forbidden');

  try {
    const result = await pool.query(
      'DELETE FROM urls WHERE short_id = $1 AND user_id = $2 RETURNING id',
      [shortId, userId]
    );

    if (result.rowCount === 0) {
      // nothing deleted (not found or not owned)
      return res.status(404).send('Not found or not permitted');
    }

    return res.redirect('/');
  } catch (err) {
    console.error('Error deleting short url:', err);
    return res.status(500).send('Server error');
  }
}



export async function getAllUrls(req, res) {
  try {
    const userId = req.cookies.user_id;

    if (!userId) {
      return res.render('main', { urls: [] });
    }

    const result = await pool.query(
      `SELECT short_id, original_url, expires_at, clicks
       FROM urls
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const urls = result.rows;

    const urlsWithQr = await Promise.all(urls.map(async (r) => {
      try {
        const qr = await QRCode.toDataURL(r.original_url);
        return { ...r, qr };
      } catch (e) {
        return { ...r, qr: null };
      }
    }));

    let lastShort = null;
    if (req.cookies && req.cookies.last_short) {
      try {
        lastShort = JSON.parse(req.cookies.last_short);
      } catch (e) {
        lastShort = null;
      }
      res.cookie('last_short', '', { maxAge: 0 });
    }

    res.render("main", { urls: urlsWithQr, lastShort });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
}


