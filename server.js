import express from "express";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";

const app = express();

app.use(cors());

// 🚨 IMPORTANT : augmenter limite pour base64
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
 * 📁 MULTER CONFIG (IMAGE UPLOAD)
 * =========================
 */
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * =========================
 * 🔥 HEALTH CHECK (Render)
 * =========================
 */
app.get("/", (req, res) => {
  res.send("OCR backend running 🚀");
});

/**
 * =========================
 * 🚀 OCR IMAGE ROUTE (FORMDATA)
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

    // 📷 OCR image
    if (imagePath) {
      const result = await Tesseract.recognize(
        imagePath,
        "eng+fra",
        {
          logger: (m) => console.log(m),
        }
      );

      text = result.data.text;
    }

    // ✍️ texte manuel
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
 * 🚀 NEW : OCR BASE64 (EXPO SAFE)
 * =========================
 */
app.post("/ocr-base64", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    // convert base64 -> buffer
    const buffer = Buffer.from(image, "base64");

    const result = await Tesseract.recognize(
      buffer,
      "eng+fra",
      {
        logger: (m) => console.log(m),
      }
    );

    const text = result.data.text;

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
