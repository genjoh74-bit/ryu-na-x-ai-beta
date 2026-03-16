require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const rateLimit = require("express-rate-limit");

const User = require("./models/User");

const app = express();

mongoose.connect(process.env.MONGO_URI);

app.use(express.json());
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// 🔥 Rate limit for brute-force protection
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5
});


// 🧬 Generate User ID
function generateUserId() {
  return "ID-" + Math.floor(100000 + Math.random() * 900000);
}


// ================= REGISTER =================
app.post("/api/register", async (req, res) => {

  const { password } = req.body;

  if (!password || password.length < 4)
    return res.json({ error: "Password too short" });

  const hashed = await bcrypt.hash(password, 10);

  const userId = generateUserId();

  await User.create({
    userId,
    password: hashed
  });

  res.json({ userId });
});


// ================= LOGIN =================
app.post("/api/login", loginLimiter, async (req, res) => {

  const { userId, password } = req.body;

  const user = await User.findOne({ userId });

  if (!user) return res.json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) return res.json({ error: "Invalid credentials" });

  req.session.userId = user.userId;

  res.json({ success: true });
});


// ================= AUTH CHECK =================
app.get("/api/me", (req, res) => {
  if (!req.session.userId) return res.status(401).end();
  res.json({ userId: req.session.userId });
});


// ================= LOGOUT =================
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});


// ================= AI PROXY =================
app.get("/api/ai", async (req, res) => {

  if (!req.session.userId) return res.status(401).end();

  const prompt = req.query.prompt;

  const url =
    `https://api.siputzx.my.id/api/ai/gemini-lite?prompt=${encodeURIComponent(prompt)}&model=gemini-2.0-flash-lite`;

  const r = await fetch(url);
  const data = await r.json();

  res.json(data);
});


app.listen(process.env.PORT, () =>
  console.log("RYU-NA X running on port " + process.env.PORT)
);
