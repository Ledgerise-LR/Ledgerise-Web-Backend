
const express = require("express");
const router = express.Router();

// GET
const getAssetGetController = require("../controllers/activeItem/get/getAssetGetController");
const getAllActiveItemsGetController = require("../controllers/activeItem/get/getAllActiveItemsGetController");
const getRandomFeaturedAssetGetController = require("../controllers/activeItem/get/getRandomFeaturedAssetGetController");
const getAllVisualVerificationsGetController = require("../controllers/activeItem/get/getAllVisualVerificationsGetController");
const getGeneralQrDataGetController = require("../controllers/activeItem/get/getGeneralQrDataGetController.js")

// POST
const listActiveItemPostController = require("../controllers/activeItem/post/listActiveItemPostController");
const getVisualVerificationsOfItemPostController = require("../controllers/activeItem/post/getVisualVerificationsOfItemPostController");
const markQrCodeAsPrintedPostController = require("../controllers/activeItem/post/markQrCodeAsPrintedPostController.js")
const updateActiveItemPostController = require("../controllers/activeItem/post/updateActiveItemPostController.js");
const cancelActiveItemPostController = require("../controllers/activeItem/post/cancelActiveItemPostController.js");

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
  "/get-visual-verifications-filter",
  getVisualVerificationsOfItemPostController
);

router.post(
  "/list-item", 
  listActiveItemPostController
);

router.post(
  "/update-item",
  updateActiveItemPostController
)

router.post(
  "/cancel-item",
  cancelActiveItemPostController
)

router.post(
  "/mark-qr-code-as-printed",
  markQrCodeAsPrintedPostController
)

router.get(
  "/get-general-qr-data",
  getGeneralQrDataGetController
)

module.exports = router;
