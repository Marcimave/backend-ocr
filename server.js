import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import Tesseract from "tesseract.js";
import Med from "./models/Med.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on", PORT);
});

/**
 * 🌐 ROUTES TEST
 */
app.get("/", (req, res) => {
  res.send("Backend OK 🚀");
});

app.get("/test", (req, res) => {
  res.json({ success: true });
});

/**
 * 🔥 MIDDLEWARES (IMPORTANT - Render + Expo)
 */
app.use(cors({
  origin: "*"
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/**
 * 🔌 MONGODB CONNECT (SAFE + CLEAN LOG)
 */
let isMongoConnected = false;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");
    isMongoConnected = true;
  })
  .catch((err) => {
    console.log("❌ MongoDB error:", err.message);
  });

/**
 * 🧼 CLEAN TEXT
 */
function clean(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 🔍 OCR ROUTE (STABLE + SAFE)
 */
app.post("/ocr-base64", async (req, res) => {
  try {
    const { image, text } = req.body;

    if (!image && !text) {
      return res.status(400).json({
        success: false,
        error: "No image or text provided",
      });
    }

    let rawText = "";

    /**
     * 📸 IMAGE OCR
     */
    if (image) {
      try {
        const buffer = Buffer.from(image, "base64");

        const result = await Tesseract.recognize(
          buffer,
          "eng+fra"
        );

        rawText = result.data.text || "";
      } catch (ocrErr) {
        console.log("❌ OCR FAIL:", ocrErr.message);

        return res.status(500).json({
          success: false,
          error: "OCR failed",
        });
      }
    }

    /**
     * ⌨️ TEXT MODE
     */
    if (text) {
      rawText = text;
    }

    const cleaned = clean(rawText);

    /**
     * 💊 MED SEARCH (SAFE MODE)
     */
    let found = [];

    if (isMongoConnected) {
      try {
        const meds = await Med.find();

        found = meds.filter((m) =>
          cleaned.includes(m.name.toLowerCase())
        );
      } catch (dbErr) {
        console.log("❌ DB ERROR:", dbErr.message);
      }
    }

    /**
     * ✅ RESPONSE FINAL
     */
    return res.json({
      success: true,
      text: rawText,
      cleanedText: cleaned,
      meds: found,
      mongo: isMongoConnected
    });

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

/**
 * 🚀 START SERVER (RENDER SAFE)
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
