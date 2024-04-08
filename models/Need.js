
const mongoose = require("mongoose");

const needSchema = new mongoose.Schema({
  
  needTokenId: {
    type: Number,
    default: ""
  },

  name: {
    type: String
  },

  description: {
    type: String
  },

  quantity: {
    type: Number,
    default: ""
  },

  beneficiaryPhoneNumber: {
    type: String,
    default: ""
  },

  timestamp: {
    type: Number,
    default: ""
  },

  currentSatisfiedNeedQuantity: {
    type: Number,
    defualt: 0
  },

  beneficiary_id: {
    type: String,
    default: ""
  },

  transactionHash: {
    type: String,
    default: ""
  },

  timestamp: {
    type: String,
    default: ""
  },

  location: {
    latitude: {
      type: Number
    },

    longitude: {
      type: Number
    }
  },

  marketplaceAddress: {
    type: String
  },

  ledgeriseLensAddress: {
    type: String
  },

  providerUrl: {
    type: String
  },

  nftAddress: {
    type: String
  },

  subcollectionId: {
    type: Number
  }
});

needSchema.statics.addNewNeed = function (body, callback) {
  const newNeed = new Need(body);
  if (newNeed) {
    newNeed.save();
    return callback(null, newNeed);
  }
  return callback("bad_request");
}

const Need = mongoose.model("need", needSchema);

module.exports = Need;

