
const express = require("express");
const router = express.Router();


// Get
const getCollectionItemsGetController = require("../controllers/subcollections/get/getCollectionItemsGetController");
const getAllCollectionsGetController = require("../controllers/subcollections/get/getAllCollectionsGetController");
const getCollectionInfoGetController = require("../controllers/subcollections/get/getCollectionInfoGetController");
const sortOldestGetController = require("../controllers/subcollections/get/sortOldestGetController");
const sortNewestGetController = require("../controllers/subcollections/get/sortNewestGetController");
const sortPriceAscendingGetController = require("../controllers/subcollections/get/sortPriceAscendingGetController");
const sortPriceDescendingGetController = require("../controllers/subcollections/get/sortDescendingGetController");
const getAllItemsCollectionGetController = require("../controllers/subcollections/get/getAllItemsCollectionGetController");


// Post
const createSubcollectionPostController = require("../controllers/subcollections/post/createSubcollectionPostController");
const updateSubcollectionPostController = require("../controllers/subcollections/post/updateSubcollectionPostController");
const isVerifierLoggedIn = require("../middleware/isVerifierLoggedIn");


router.get(
  "/get-collection", 
  getCollectionItemsGetController
);

router.get(
  "/get-all-collections", 
  getAllCollectionsGetController
);

router.get(
  "/get-single-collection", 
  getCollectionInfoGetController
);

router.get(
  "/sort/price-ascending", 
  sortPriceAscendingGetController
);

router.get(
  "/sort/price-descending", 
  sortPriceDescendingGetController
);

router.get(
  "/sort/oldest", 
  sortOldestGetController
);

router.get(
  "/sort/newest", 
  sortNewestGetController
);

router.get(
  "/get-all-items-collection", 
  getAllItemsCollectionGetController
);

router.post(
  "/create-subcollection", 
  isVerifierLoggedIn,
  createSubcollectionPostController
);

router.post(
  "/update-subcollection-image", 
  isVerifierLoggedIn,
  updateSubcollectionPostController
);

module.exports = router;
