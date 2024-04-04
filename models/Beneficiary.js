
const mongoose = require("mongoose");
const axios = require("axios");
const base64 = require("base-64");

const beneficiarySchema = new mongoose.Schema({

  name: {
    type: String
  },
  national_id_number: {
    type: Number
  },

  needs: [
    {
      type: mongoose.Types.ObjectId  // will be one of the activeItems
    }
  ],

  email: {
    type: String,
    required: true
  },

  phone_number: {
    type: String,
    default: ""
  },

  password: {
    type: String,
    required: true
  }
});

beneficiarySchema.statics.addNewBeneficiary = function (body, callback) {
  const newBeneficiary = new Beneficiary(body);
  if (newBeneficiary) {
    newBeneficiary.save();
    return callback(null, newBeneficiary);
  }
  return callback("bad_request");
}

beneficiarySchema.statics.loginBeneficiary = function (body, callback) {

  Beneficiary.findOne({ national_id_number: parseInt(body.national_id_number) }, (err, beneficiary) => {
    if (err) return callback("bad_request");
    if (beneficiary && body.password == beneficiary.password) return callback(null, beneficiary);
    return callback("verify_error")
  })
}

beneficiarySchema.statics.authenticateBeneficiary = function (body, callback) {
  Beneficiary.findById(body._id, (err, beneficiary) => {
    if (err || !beneficiary) return callback("auth_error");
    if (beneficiary && beneficiary._id == body._id) return callback(null, beneficiary);
  })
}

const Beneficiary = mongoose.model("beneficiary", beneficiarySchema);

module.exports = Beneficiary;
