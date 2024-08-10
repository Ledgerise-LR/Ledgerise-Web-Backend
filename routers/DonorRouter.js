
const express = require("express");
const router = express.Router();

// POST
const getReceiptDataPostController = require("../controllers/donor/post/getReceiptDataPostController");
const isDonorLoggedIn = require("../middleware/isDonorLoggedIn");

router.post(
  "/get-receipt-data", 
  // isDonorLoggedIn,
  getReceiptDataPostController
);

module.exports = router;
