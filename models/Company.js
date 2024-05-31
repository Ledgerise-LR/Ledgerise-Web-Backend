
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
    if (err || !company) return callback("verify_error");
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

companySchema.statics.getAllCollectionsOfCompany = async function (body, callback) {

  subcollection.find({ companyCode: body.code }, (err, subcollections) => {

    let resArray = [];

    async.timesSeries(subcollections.length, (i, next) => {
      const eachSubcollection = subcollections[i];

      Company.findOne({ code: eachSubcollection.companyCode }, (err, company) => {
        if (err || !company) return callback(err);

        const data = {
          itemId: eachSubcollection.itemId,
          name: eachSubcollection.name,
          image: eachSubcollection.image,
          nftAddress: eachSubcollection.nftAddress,
          totalRaised: eachSubcollection.totalRaised,
          charityAddress: company.charityAddress,
          charityName: company.name,
          companyImage: company.image,
        }

        resArray.push(data);

        next();
      })
    }, (err) => {
      if (err) return callback(err);
      callback(null, resArray);
    })
  })
}

companySchema.statics.getAllCollections = async function (body, callback) {
  subcollection.find({}, (err, subcollections) => {

    let resArray = [];

    async.timesSeries(subcollections.length, (i, next) => {
      const eachSubcollection = subcollections[i];

      Company.findOne({ code: eachSubcollection.companyCode }, (err, company) => {
        if (err || !company) return res.json({ success: false, err: err });

        const data = {
          itemId: eachSubcollection.itemId,
          name: eachSubcollection.name,
          image: eachSubcollection.image,
          totalRaised: eachSubcollection.totalRaised,
          nftAddress: eachSubcollection.nftAddress,
          charityAddress: company.charityAddress,
          charityName: company.name,
          companyImage: company.image,
          companyCode: company.code
        }

        resArray.push(data);

        next();
      })
    }, (err) => {
      if (err) return callback(err);
      return callback(null, resArray);
    })
  })
}

const Company = mongoose.model("company", companySchema);

module.exports = Company


