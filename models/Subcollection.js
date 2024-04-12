
const mongoose = require("mongoose");

const subcollectionSchema = new mongoose.Schema({
  itemId: {
    type: String
  },
  name: {
    type: String
  },

  companyCode: {
    type: String,
    required: false,
    trim: true
  },

  nftAddress: {
    type: String,
    default: ""
  },

  properties: [
    property = {
      type: String
    }
  ],
  image: {
    type: String
  },
  totalRaised: {
    type: String,
    default: "0"
  },

  marketplaceAddress: {
    type: String,
    default: ""
  },

  ledgeriseLensAddress: {
    type: String,
    default: ""
  },

  providerUrl: {
    type: String,
    default: ""
  },

  transactionHash: {
    type: String
  }
});

subcollectionSchema.statics.createSubcollection = function (body, callback) {
  const newSubcollection = new subcollection(body);
  if (newSubcollection) {
    newSubcollection.save();
    return callback(null, newSubcollection);
  }
  return callback("bad_request");
}

const subcollection = mongoose.model("subcollection", subcollectionSchema);

module.exports = subcollection
