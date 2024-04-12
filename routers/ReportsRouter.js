
const express = require("express");
const router = express.Router();

// Get
const getPastReportsGetController = require("../controllers/reports/get/getPastReportsGetController");

// Post
const reportIssuePostController = require("../controllers/reports/post/reportIssuePostController");

router.get(
  "/get-past", 
  getPastReportsGetController
);

router.post(
  "/report-issue", 
  reportIssuePostController
);

module.exports = router;
