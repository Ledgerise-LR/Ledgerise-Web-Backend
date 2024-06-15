
const express = require("express");
const router = express.Router();

// Get
const getAllCollectionsOfCompanyGetController = require("../controllers/company/get/getAllCollectionsOfCompanyGetController");
const getAllCompaniesGetController = require("../controllers/company/get/getAllCompaniesGetController");
const getCompanyPanelGetController = require("../controllers/company/get/getCompanyPanelGetController.js");
const getCompanyStatisticsGetController = require("../controllers/company/get/getStatisticsGetController");

// Post
const getNameFromCodePostController = require("../controllers/company/post/getNameFromCodePostController");
const getAllItemsOfCompanyPostController = require("../controllers/company/post/getAllItemsOfCompanyPostController");
const getCompanyFromCodePostController = require("../controllers/company/post/getCompanyFromCodePostController");

router.get(
  "/get-all-collections", 
  getAllCollectionsOfCompanyGetController
);

router.get(
  "/get-all", 
  getAllCompaniesGetController
);

router.post(
  "/get-name-from-code", 
  getNameFromCodePostController
);

router.get(
  "/get-company-from-code", 
  getCompanyFromCodePostController
);


router.get(
  "/get-all-items", 
  getAllItemsOfCompanyPostController
);

router.get(
  "/get-company-panel-data",
  getCompanyPanelGetController
)

router.get(
  "/get-company-statistics",
  getCompanyStatisticsGetController
)


module.exports = router;
