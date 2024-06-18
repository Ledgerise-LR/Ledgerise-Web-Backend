
const express = require("express");
const router = express.Router();

// GET
const authenticateBeneficiaryGetController = require("../controllers/auth/get/authenticateBeneficiaryGetController");
const authenticateVerifierGetController = require("../controllers/auth/get/authenticateVerifierGetController");
const authenticateCompanyGetController = require("../controllers/auth/get/authenticateCompanyGetController");

// POST
const authenticateDonorPostController = require("../controllers/auth/post/authenticateDonorPostController");
const loginDonorPostController = require("../controllers/auth/post/loginDonorPostController");
const registerDonorPostController = require("../controllers/auth/post/registerDonorPostController");
const loginVerifierPostController = require("../controllers/auth/post/loginVerifierPostController");
const createCompanyPostController = require("../controllers/auth/post/createCompanyPostController");
const loginBeneficiaryPostController = require("../controllers/auth/post/loginBeneficiaryPostController");
const registerBeneficiaryPostController = require("../controllers/auth/post/registerBeneficiaryPostController.js");

router.get(
  "/authenticate-verifier", 
  authenticateVerifierGetController
);

router.get(
  "/authenticate-company",
  authenticateCompanyGetController
)

router.get(
  "/authenticate-beneficiary", 
  authenticateBeneficiaryGetController
);

router.post(
  "/login", 
  loginDonorPostController
);

router.post(
  "/authenticate", 
  authenticateDonorPostController
);

router.post(
  "/register", 
  registerDonorPostController
);

router.post(
  "/login-verifier",
  loginVerifierPostController
);

router.post(
  "/login-company",
  loginVerifierPostController
);

router.post(
  "/company/create", 
  createCompanyPostController
);

router.post(
  "/login-beneficiary", 
  loginBeneficiaryPostController
);

router.post(
  "/register-beneficiary",
  registerBeneficiaryPostController
);

module.exports = router;
