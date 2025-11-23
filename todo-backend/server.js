// ===============================================
// Load Environment Variables
// ===============================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

// Authentication
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Models
const User = require("./models/User");

// Middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, "SECRET123");
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

const app = express();
app.use(express.json());
app.use(cors());

// ===============================================
// Azure Cognitive Services Configuration
// ===============================================
const AZURE_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_KEY = process.env.AZURE_OPENAI_API_KEY;
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION;

// Azure Chat Helper
async function azureChat(messages) {
  const url = `${AZURE_ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;

  const response = await axios.post(
    url,
    { messages },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_KEY,
      },
    }
  );

  return response.data.choices[0].message.content;
}

// Cleaning JSON from AI
function cleanJSON(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

// ===============================================
// MongoDB Connection
// ===============================================
mongoose
  .connect("mongodb://localhost:27017/todo-MERN", {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ===============================================
// Todo Model
// ===============================================
const todoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  priority: String,
  dueDate: String,
  estimatedTime: String,
  userId: String
});

const Todo = mongoose.model("Todo", todoSchema);

// ===============================================
// AUTH ROUTES
// ===============================================
app.post("/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  res.json({ message: "Registered" });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, "SECRET123", { expiresIn: "7d" });

  res.json({ token });
});

// ===============================================
// CRUD ROUTES (Protected)
// ===============================================

// CREATE
app.post("/todos", auth, async (req, res) => {
  const todo = await Todo.create({
    ...req.body,
    userId: req.userId
  });
  res.json(todo);
});

// GET (only user tasks)
app.get("/todos", auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

// UPDATE
app.put("/todos/:id", auth, async (req, res) => {
  const updated = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  res.json(updated);
});

// DELETE
app.delete("/todos/:id", auth, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

// ===============================================
// AI ROUTES (Protected)
// ===============================================

app.post("/ai/parse", auth, async (req, res) => {
  try {
    // Provide the model with the current date and require ISO date output
    const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const prompt = `
Return ONLY valid JSON. No markdown.

- Resolve any relative dates (for example "tomorrow", "next week") relative to the provided CURRENT_DATE.
- ALWAYS return ` + "`dueDate`" + ` in ISO format: YYYY-MM-DD, or an empty string if no date is present.
- Do NOT return two-digit years. Use 4-digit years.

{
 "title": "",
 "description": "",
 "category": "",
 "priority": "",
 "dueDate": "",
 "estimatedTime": ""
}

CURRENT_DATE: "${currentDate}"

Task: "${req.body.text}"
`;

    const raw = await azureChat([{ role: "user", content: prompt }]);
    res.json(JSON.parse(cleanJSON(raw)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/ai/improve", auth, async (req, res) => {
  try {
    const prompt = `
Return ONLY valid JSON.

{
 "improvedTitle": "",
 "improvedDescription": ""
}

Title: "${req.body.title}"
Description: "${req.body.description}"
`;

    const raw = await azureChat([{ role: "user", content: prompt }]);
    res.json(JSON.parse(cleanJSON(raw)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/ai/classify", auth, async (req, res) => {
  try {
    const prompt = `
Return ONLY valid JSON.

{
 "category": "",
 "priority": ""
}

Title: "${req.body.title}"
Description: "${req.body.description}"
`;

    const raw = await azureChat([{ role: "user", content: prompt }]);
    res.json(JSON.parse(cleanJSON(raw)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================================
// Start Server
// ===============================================
app.listen(8000, () => console.log("Server running on port 8000"));
