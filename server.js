const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Store all records in memory + a JSON file for persistence
const DATA_FILE = "data.json";
let records = [];

if (fs.existsSync(DATA_FILE)) {
  records = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

// Receive CSV upload from the app
app.post("/upload-csv", express.text({ type: "*/*" }), (req, res) => {
  const csv = req.body;
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  const newRecords = lines.slice(1).map(line => {
    const values = line.split(",");
    const record = {};
    headers.forEach((h, i) => {
      record[h.trim()] = values[i]?.trim() || "";
    });
    record.id = Date.now().toString() + Math.random();
    return record;
  });

  records.push(...newRecords);
  saveData();
  res.json({ success: true, added: newRecords.length });
});

// Get all records as JSON for the dashboard
app.get("/records", (req, res) => {
  res.json(records);
});

// Clear all records
app.delete("/records", (req, res) => {
  records = [];
  saveData();
  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CarTemp Server running at http://localhost:${PORT}`);
  console.log(`On your network: http://YOUR_LAPTOP_IP:${PORT}`);
});