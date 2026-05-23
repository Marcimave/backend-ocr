import express from "express";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";
import os from "os";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

/**
 * =========================
 * 🧠 OCR TEXT ROUTE
 * =========================
 */
app.post("/ocr-text", (req, res) => {
  const { text } = req.body;

  const meds = extractMedications(text || "");

  res.json({
    text,
    meds,
  });
});

/**
 * =========================
 * 📁 MULTER CONFIG
 * =========================
 */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/**
 * =========================
 * 🔥 HEALTH CHECK
 * =========================
 */
app.get("/", (req, res) => {
  res.send("OCR backend running 🚀");
});

/**
 * =========================
 * 🚀 OCR IMAGE ROUTE
 * =========================
 */
app.post("/ocr", upload.single("image"), async (req, res) => {
  let imagePath;

  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    imagePath = req.file?.path;

    let text = "";

    if (imagePath) {
      const result = await Tesseract.recognize(
        imagePath,
        "eng+fra",
        { logger: (m) => console.log(m) }
      );

      text = result.data.text;
    }

    if (req.body.text) {
      text += " " + req.body.text;
    }

    const meds = extractMedications(text);

    res.json({
      success: true,
      text: text.trim(),
      meds,
    });

  } catch (err) {
    console.error("OCR ERROR:", err);
    res.status(500).json({ error: "OCR failed" });

  } finally {
    if (imagePath) {
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {
        console.log("Cleanup error:", e.message);
      }
    }
  }
});

/**
 * =========================
 * 🚀 OCR BASE64 (FIXÉ + STABLE)
 * =========================
 */
app.post("/ocr-base64", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // 🔥 CREATE TEMP FILE (FIX RENDER + TESSERACT BUG)
    const filePath = path.join(os.tmpdir(), `ocr_${Date.now()}.jpg`);

    fs.writeFileSync(filePath, image, "base64");

    const result = await Tesseract.recognize(
      filePath,
      "eng+fra",
      {
        logger: (m) => console.log(m),
      }
    );

    const text = result.data.text;

    fs.unlinkSync(filePath);

    const meds = extractMedications(text);

    res.json({
      success: true,
      text: text.trim(),
      meds,
    });

  } catch (err) {
    console.error("OCR BASE64 ERROR:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

/**
 * =========================
 * 🧠 MEDICATION EXTRACTION
 * =========================
 */
function extractMedications(text) {
  const knownMeds = [
    "paracetamol",
    "paracétamol",
    "amoxicillin",
    "ibuprofen",
    "aspirin",
  ];

  const lower = (text || "").toLowerCase();

  return knownMeds.filter((med) =>
    lower.includes(med)
  );
}

/**
 * =========================
 * 🚀 SERVER START
 * =========================
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 OCR Server running on port ${PORT}`);
});
