
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  image: {
    type: String,
    required: false
  },

  charityAddress: {
    type: String,
    required: true,
    trim: true
  }

});

companySchema.statics.createNewCompany = function (body, callback) {
  const newCompany = new Company(body);
  if (newCompany) {
    newCompany.save();
    return callback(null, newCompany);
  }
  return callback("bad_request");
}

companySchema.statics.loginVerifier = function (body, callback) {
  Company.findOne({ code: body.code, password: body.password }, (err, company) => {
    if (err) return callback("verify_error");
    return callback(null, company);
  })
}

companySchema.statics.authenticateVerifier = function (body, callback) {
  Company.findOne({ code: body.code }, (err, company) => {
    if (err || !company) return callback("auth_error");
    if (company && company._id == body._id) return callback(null, company);
  })
}

const Company = mongoose.model("company", companySchema);

module.exports = Company


