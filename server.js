import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Tesseract from "tesseract.js"; // ⚠️ MANQUANT
import Med from "./models/Med.js";    // ⚠️ MANQUANT

dotenv.config();

const app = express();
app.use(express.json()); // ⚠️ IMPORTANT

// ✅ Connexion MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch((err) => console.log("❌ MongoDB error:", err));

/**
 * =========================
 * 🧠 SEARCH FUNCTION
 * =========================
 */
async function searchMedicines(text) {
  if (!text) return [];

  const lower = text.toLowerCase();
  const meds = await Med.find();

  return meds.filter(med =>
    lower.includes(med.name.toLowerCase())
  );
}

/**
 * =========================
 * 🚀 OCR BASE64 ROUTE
 * =========================
 */
app.post("/ocr-base64", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const buffer = Buffer.from(image, "base64");

    const result = await Tesseract.recognize(buffer, "eng+fra");

    const text = result.data.text;

    const meds = await searchMedicines(text);

    res.json({
      success: true,
      text,
      meds,
    });

  } catch (err) {
    console.error("OCR ERROR:", err);
    res.status(500).json({ error: "OCR failed" });
  }
});

/**
 * =========================
 * 🚀 START SERVER (TOUT EN BAS)
 * =========================
 */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
