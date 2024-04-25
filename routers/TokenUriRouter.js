
const express = require("express");
const router = express.Router();

// GET
const getAllTokenUrisGetController = require("../controllers/tokenUri/get/getAllTokenUrisGetController");

// POST
const createTokenUriPostController = require("../controllers/tokenUri/post/createTokenUriPostController");

// Middleware
const isCompanyLoggedIn = require("../middleware/isVerifierLoggedIn");

router.get(
  "/get-all", 
  getAllTokenUrisGetController
);

router.post(
  "/create", 
  // isCompanyLoggedIn,
  createTokenUriPostController
);

module.exports = router;
