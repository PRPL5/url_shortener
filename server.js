import express from "express";
import cookieParser from "cookie-parser";
import { v4 as uuidv4 } from "uuid";
import urlRoutes from "./routes/urlRoutes.js";
import { getAllUrls } from "./controllers/urlController.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use((req, res, next) => {
  if (!req.cookies.user_id) {
    res.cookie("user_id", uuidv4(), { httpOnly: true });
  }
  next();
});

app.set("view engine", "ejs");

app.get("/", getAllUrls);

app.use("/", urlRoutes);

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);


app.get('/short.link/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;
  const originalUrl = urlMap[shortUrl];

  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).send('URL not found');
  }
});

app.use((req, res, next) => {
  if (!req.cookies.user_id) {
    const newUserId = uuidv4();
    res.cookie("user_id", newUserId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    req.cookies.user_id = newUserId; 
    console.log("Assigned new user_id:", newUserId);
  }
  next();
});