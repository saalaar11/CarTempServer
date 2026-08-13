const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
// const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use((req, res, next) => {
  if (req.path === "/" || req.path.endsWith(".html")) {
    res.set("Cache-Control", "no-store");
  }
  next();
});

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
  try {
    const csv = req.body;
    if (!csv || typeof csv !== "string") {
      return res.status(400).json({ success: false, error: "No CSV body received" });
    }
    
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: "CSV has no data rows" });
    }
    
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
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
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

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`CarTemp Server running at http://localhost:${PORT}`);
});