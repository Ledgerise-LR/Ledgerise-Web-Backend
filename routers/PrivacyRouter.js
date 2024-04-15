
const express = require("express");
const router = express.Router();

const blurVisualGetController = require("../controllers/privacy/get/blurVisualGetController.js");

router.get(
  "/blur-visual",
  blurVisualGetController
)

module.exports = router;
