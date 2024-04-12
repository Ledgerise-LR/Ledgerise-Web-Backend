
const express = require("express");
const router = express.Router();

// GET
const getAssetGetController = require("../controllers/activeItem/get/getAssetGetController");
const getAllActiveItemsGetController = require("../controllers/activeItem/get/getAllActiveItemsGetController");
const getRandomFeaturedAssetGetController = require("../controllers/activeItem/get/getRandomFeaturedAssetGetController");
const getAllVisualVerificationsGetController = require("../controllers/activeItem/get/getAllVisualVerificationsGetController");

// POST
const listActiveItemPostController = require("../controllers/activeItem/post/listActiveItemPostController");
const isVerifierLoggedIn = require("../middleware/isVerifierLoggedIn");


router.get(
  "/get-asset", 
  getAssetGetController
);

router.get(
  "/get-all-active-items", 
  getAllActiveItemsGetController
);

router.get(
  "/get-random-featured-asset", 
  getRandomFeaturedAssetGetController
);

router.get(
  "/get-all-visual-verifications", 
  getAllVisualVerificationsGetController
);

router.post(
  "/list-item", 
  isVerifierLoggedIn,
  listActiveItemPostController
);

module.exports = router;
