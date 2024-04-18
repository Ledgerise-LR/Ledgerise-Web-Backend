
const express = require("express");
const router = express.Router();

// POST
const donateCryptoPostController = require("../controllers/donate/post/donateCryptoPostController");
const donateTryPostController = require("../controllers/donate/post/donateTryPostController");
const donateAlreadyBoughtPostController = require("../controllers/donate/post/donateAlreadyBoughtPostController");
const isDonorLoggedIn = require("../middleware/isDonorLoggedIn");


router.post(
  "/payment/crypto/eth", 
  isDonorLoggedIn,
  donateCryptoPostController
);

router.post(
  "/payment/TRY", 
  isDonorLoggedIn,
  donateTryPostController
);

router.post(
  "/payment/already_bought", 
  // isDonorLoggedIn,
  donateAlreadyBoughtPostController
);


module.exports = router;
