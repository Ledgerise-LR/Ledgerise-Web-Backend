
const express = require("express");
const router = express.Router();

// GET 
const getAllWhatsappVerifiersPostController = require("../controllers/whatsappVerifier/get/getAllWhatsappVerifiersPostController.js");

// POST
const createWhatsappVerifierPostController = require("../controllers/whatsappVerifier/post/createWhatsappVerifierPostController");

router.get(
  "/get-all",
  getAllWhatsappVerifiersPostController
);

router.post(
  "/create",
  createWhatsappVerifierPostController
);

module.exports = router;
