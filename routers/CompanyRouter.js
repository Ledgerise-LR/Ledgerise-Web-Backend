
const express = require("express");
const router = express.Router();

// Get
const getAllCollectionsOfCompanyGetController = require("../controllers/company/get/getAllCollectionsOfCompanyGetController");
const getAllCompaniesGetController = require("../controllers/company/get/getAllCompaniesGetController");


// Post
const getNameFromCodePostController = require("../controllers/company/post/getNameFromCodePostController");
const getAllItemsOfCompanyPostController = require("../controllers/company/post/getAllItemsOfCompanyPostController");
const getCompanyFromCodePostController = require("../controllers/company/post/getCompanyFromCodePostController");

router.get(
  "/company/get-all-collections", 
  getAllCollectionsOfCompanyGetController
);

router.get(
  "/company/get-all", 
  getAllCompaniesGetController
);

router.post(
  "/company/get-name-from-code", 
  getNameFromCodePostController
);

router.post(
  "/company/get-company-from-code", 
  getCompanyFromCodePostController
);


router.post(
  "/company/get-all-items", 
  getAllItemsOfCompanyPostController
);


module.exports = router;
