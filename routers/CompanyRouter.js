
const express = require("express");
const router = express.Router();

// Get
const getAllCollectionsOfCompanyGetController = require("../controllers/company/get/getAllCollectionsOfCompanyGetController");
const getAllCompaniesGetController = require("../controllers/company/get/getAllCompaniesGetController");


// Post
const getNameFromCodePostController = require("../controllers/company/post/getNameFromCodePostController");
const getAllItemsOfCompanyPostController = require("../controllers/company/post/getAllItemsOfCompanyPostController");
const getCompanyFromCodePostController = require("../controllers/company/post/getCompanyFromCodePostController");

router.post(
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

router.post(
  "/get-company-from-code", 
  getCompanyFromCodePostController
);


router.post(
  "/get-all-items", 
  getAllItemsOfCompanyPostController
);


module.exports = router;
