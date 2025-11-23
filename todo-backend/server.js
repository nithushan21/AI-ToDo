// ===============================================
// Load Environment Variables
// ===============================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");

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

// Generic Azure Chat Request Function
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

// ===============================================
// Clean JSON Helper (removes markdown)
// ===============================================
function cleanJSON(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

// ===============================================
// MongoDB Connection
// ===============================================
mongoose
  .connect("mongodb://localhost:27017/todo-MERN", {})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ===============================================
// Mongoose Schema
// ===============================================
const todoSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  priority: String,
  dueDate: String,
  estimatedTime: String
});

const Todo = mongoose.model("Todo", todoSchema);

// ===============================================
// CRUD ROUTES
// ===============================================

// Create Task
app.post("/todos", async (req, res) => {
  try {
    const saved = await new Todo(req.body).save();
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get All Tasks
app.get("/todos", async (req, res) => {
  res.json(await Todo.find());
});

// Update Task
app.put("/todos/:id", async (req, res) => {
  const updated = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete Task
app.delete("/todos/:id", async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// ===============================================
// AI ROUTES
// ===============================================

// 1️⃣ AI Parse Natural Language Task
app.post("/ai/parse", async (req, res) => {
  try {
    const prompt = `
Return ONLY valid JSON. No markdown, no explanations.

{
 "title": "",
 "description": "",
 "category": "",
 "priority": "",
 "dueDate": "",
 "estimatedTime": ""
}

Task: "${req.body.text}"
`;

    const raw = await azureChat([{ role: "user", content: prompt }]);
    const cleaned = cleanJSON(raw);

    res.json(JSON.parse(cleaned));

  } catch (err) {
    console.error("AI PARSE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ AI Improve Task
app.post("/ai/improve", async (req, res) => {
  try {
    const prompt = `
Return ONLY valid JSON. No markdown.

{
 "improvedTitle": "",
 "improvedDescription": ""
}

Title: "${req.body.title}"
Description: "${req.body.description}"
`;

    const raw = await azureChat([{ role: "user", content: prompt }]);
    const cleaned = cleanJSON(raw);

    res.json(JSON.parse(cleaned));

  } catch (err) {
    console.error("AI IMPROVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ AI Categorize + Prioritize Task
app.post("/ai/classify", async (req, res) => {
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
    const cleaned = cleanJSON(raw);

    res.json(JSON.parse(cleaned));

  } catch (err) {
    console.error("AI CLASSIFY ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================================
// Start Server
// ===============================================
app.listen(8000, () => console.log("Server running on port 8000"));
