const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const analyzeImageController = require("../controllers/analyze-image");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const result = await analyzeImageController.analyzeImage(imagePath);
    fs.unlinkSync(imagePath); // מוחק את הקובץ אחרי עיבוד
    res.json(result);
  } catch (err) {
    console.error("Error analyzing image:", err);
    res.status(500).json({ error: "Failed to analyze image" });
  }
});

module.exports = router;
