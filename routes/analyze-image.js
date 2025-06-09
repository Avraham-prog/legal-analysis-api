const express = require("express");
const router = express.Router();
const multer = require("multer");
const analyzeImageController = require("../controllers/analyze-image");

const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("image"), analyzeImageController.handleAnalyzeImage);

module.exports = router;
