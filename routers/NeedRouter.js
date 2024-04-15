
const express = require("express");
const router = express.Router();

// GET
const getAllNeedsGetController = require("../controllers/need/get/getAllNeedsGetController");
const getNeedItemNeedDetailsGetController = require("../controllers/need/get/getNeedItemNeedDetailsGetController")

// POST
const listNeedItemPostController = require("../controllers/need/post/listNeedItemPostController");
const getSatisfiedDonationsOfDonorPostController = require("../controllers/need/post/getSatisfiedDonationsOfDonorPostController");
const createNeedPostController = require("../controllers/need/post/createNeedPostController");
const getNeedsOfBeneficiaryPostController = require("../controllers/need/post/getNeedsOfBeneficiaryPostController.js");
const isBeneficiaryLoggedIn = require("../middleware/isBeneficiaryLoggedIn");
const isDonorLoggedIn = require("../middleware/isDonorLoggedIn");


router.post(
  "/get-all-needs", 
  getAllNeedsGetController
);

router.post(
  "/create", 
  isBeneficiaryLoggedIn,
  createNeedPostController
);


router.post(
  "/list-need-item", 
  isDonorLoggedIn,
  getSatisfiedDonationsOfDonorPostController
)

router.get(
  "/get-need-item-need-details",
  isDonorLoggedIn,
  getNeedItemNeedDetailsGetController
)

router.get(
  "/get-satisfied-donations-of-donor", 
  listNeedItemPostController
)

router.get(
  "/get-needs-of-beneficiary",
  isBeneficiaryLoggedIn,
  getNeedsOfBeneficiaryPostController
)

module.exports = router;
