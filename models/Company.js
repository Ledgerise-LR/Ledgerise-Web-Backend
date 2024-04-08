
const mongoose = require("mongoose");
const subcollection = require("./Subcollection");
const ActiveItem = require("./ActiveItem");
const async = require("async");

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
    trim: true
  },

  password: {
    type: String,
    required: true,
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
  },

  IBAN: {
    type: String,
    default: "TR"
  },

  receipientName: {
    type: String,
    default: ""
  },

  receipientDescription: {
    type: String,
    default: ""
  },

  bankName: {
    type: String,
    default: ""
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

companySchema.statics.getAllItems = function (body, callback) {

  let activeItemArray = [];

  Company.findOne({ code: body.code }, (err, company) => {
    if (err || !company) return callback("auth_error");

    subcollection.findOne({ companyCode: company.code }, (err, m_subcollection) => {
      if (err || !company) return callback("collection_error");

      ActiveItem.find({ subcollectionId: m_subcollection.itemId, nftAddress: m_subcollection.nftAddress }, (err, activeItems) => {
        if (err || !company) return callback("item_error");

        async.timesSeries(activeItems.length, (i, next) => {
          const eachActiveItem = activeItems[i];

          const activeItemObject = {
            tokenUri: eachActiveItem.tokenUri,
            seller: eachActiveItem.seller, 
            history: eachActiveItem.history, 
            availableEditions: eachActiveItem.availableEditions, 
            price: eachActiveItem.price,
            collectionName: m_subcollection.name,
            subcollectionId: m_subcollection.itemId
          };
        
          activeItemArray.push(activeItemObject);
          next();
        }, (err) => {
          if (err || !company) return callback("auth_error");

          return callback(null, activeItemArray);
        })
      })
    })
  })
}

const Company = mongoose.model("company", companySchema);

module.exports = Company


