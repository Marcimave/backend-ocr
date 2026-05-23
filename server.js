import express from "express";
import cors from "cors";
import multer from "multer";
import Tesseract from "tesseract.js";
import fs from "fs";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 📁 Upload config (sécurisé)
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// 🔥 HEALTH CHECK (Render obligatoire recommandé)
app.get("/", (req, res) => {
  res.send("OCR backend running 🚀");
});

// 🚀 OCR ROUTE
app.post("/ocr", upload.single("image"), async (req, res) => {
  let imagePath;

  try {
    if (!req.file && !req.body.text) {
      return res.status(400).json({ error: "No input provided" });
    }

    imagePath = req.file?.path;

    let text = "";

    // 📷 OCR image si fournie
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

    // ✍️ si texte manuel envoyé
    if (req.body.text) {
      text += " " + req.body.text;
    }

    // 🧠 extraction médicaments
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
    // 🧹 nettoyage fichier sécurisé
    if (imagePath) {
      try {
        fs.unlinkSync(imagePath);
      } catch (e) {
        console.log("Cleanup error:", e.message);
      }
    }
  }
});

// 🧠 extraction simple (V1)
function extractMedications(text) {
  const knownMeds = [
    "paracetamol",
    "paracétamol",
    "amoxicillin",
    "ibuprofen",
    "aspirin",
  ];

  const lower = text.toLowerCase();

  return knownMeds.filter((med) => lower.includes(med));
}

// 🚀 PORT CLOUD (IMPORTANT POUR RENDER)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 OCR Server running on port ${PORT}`);
});
