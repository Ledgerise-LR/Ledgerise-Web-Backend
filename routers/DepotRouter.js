
const express = require("express");
const router = express.Router();

// POST
const getDepotLocationPostController = require("../controllers/depot/post/getDepotLocationPostController");


router.post(
  "/get-depot-location", 
  getDepotLocationPostController
);

module.exports = router;
