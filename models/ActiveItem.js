
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abis = require("../constants/abi.json");
const { ethers } = require("ethers");
const CryptoJS = require("crypto-js");
require("dotenv").config();

const activeItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    reqired: true,
    trim: true,
    unique: true
  },
  seller: {
    type: String,
    required: true
  },
  charityAddress: {
    type: String
  },
  buyer: {
    type: String
  },
  nftAddress: {
    type: String
  },
  tokenId: {
    type: Number
  },
  price: {
    type: String
  },
  subcollectionId: {
    type: Number
  },
  tokenUri: { // IPFS url
    type: String,
  },
  charityImage: {
    type: String
  },
  history: [
    event = {
      key: {
        type: String  // buy, list, update
      },
      date: {
        type: String
      },
      price: {
        type: String
      },
      buyer: {
        type: String
      },
      openseaTokenId: {
        type: Number
      },
      transactionHash: {
        type: String
      }
    }
  ],

  real_item_history: [  // ! important ! currently running on centralized Web2.0. However it is too easy to store this on Blockchain.
    event = {
      key: {
        type: String  // stamp, shipped, delivered
      },
      buyer: {  // Included in qr code
        type: String
      },
      openseaTokenId: {  // Included in qr code
        type: Number
      },
      date: {
        type: String
      },
      location: {  // will be comed as hashed will not be tamperable
        type: Object
      }
    }
  ],

  availableEditions: {
    type: Number
  },

  timestamp_created: {
    type: Date,
    default: Date.now
  },

  attributes: []
});

function getFiltersByQueries(priceRange, editionRange, subcollectionId) {
  let priceFilters;
  if (priceRange) {
    priceFilters = priceRange.split(",").map(range => {
      const [min, max] = range.split("-");
      return {
        price: { $gte: ethers.utils.parseEther(min).toString(), $lte: ethers.utils.parseEther(max).toString() }
      };
    });
  }

  let editionFilters;
  if (editionRange) {
    editionFilters = editionRange.split(",").map(range => {
      const [min, max] = range.split("-");
      return {
        availableEditions: { $gte: parseInt(min), $lte: parseInt(max) }
      };
    });
  }

  let filters = {};
  if (editionRange && priceRange) {
    filters = {
      subcollectionId: subcollectionId,
      $and: [...priceFilters, ...editionFilters]
    };
  } else if (editionRange && !priceRange) {
    filters = {
      subcollectionId: subcollectionId,
      $or: [...editionFilters]
    };
  } else if (!editionRange && priceRange) {
    filters = {
      subcollectionId: subcollectionId,
      $or: [...priceFilters]
    };
  } else if (!editionRange && !priceRange) {
    filters = {
      subcollectionId: subcollectionId
    };
  }

  return filters;
}

activeItemSchema.statics.createActiveItem = function (body, callback) {
  const newActiveItem = new ActiveItem(body);
  if (newActiveItem) {
    newActiveItem.save();
    return callback(null, newActiveItem);
  }
  return callback("bad_request");
}


activeItemSchema.statics.sortDefault = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);
  ActiveItem.find(filters, (err, docs) => {
    if (err) return callback(err);
    return callback(null, docs);
  })
}


activeItemSchema.statics.sortPriceAscending = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);
  ActiveItem.find(filters)
    .sort({ price: 1 }).exec((err, docs) => {
      if (err) return callback(err);
      return callback(null, docs);
    });
}

activeItemSchema.statics.sortPriceDescending = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters)
    .sort({ price: -1 }).exec((err, docs) => {
      if (err) return callback(err);
      return callback(null, docs);
    });
}

activeItemSchema.statics.sortOldest = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters).sort({ timestamp_created: 1 }).exec((err, docs) => {
    if (err) return callback(err);
    return callback(null, docs);
  });
}

activeItemSchema.statics.sortNewest = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters).sort({ timestamp_created: -1 }).exec((err, docs) => {
    if (err) return callback(err);
    return callback(null, docs);
  });
}

activeItemSchema.statics.saveRealItemHistory = function (body, callback) {

  const decryptedBody = CryptoJS.AES.decrypt(body, process.env.AES_HASH_SECRET_KEY);
  const decryptObject = JSON.parse(decryptedBody.toString(CryptoJS.enc.Utf8));

  if (decryptObject.key == "stamp" || decryptObject.key == "shipped" || decryptObject.key == "delivered") {

    if (typeof decryptObject.location.longitude == "number" && typeof decryptObject.location.latitude == "number") {
      ActiveItem.findOne({ tokenId: decryptObject.marketplaceTokenId }, (err, activeItem) => {

        if (err) return callback(err, null);

        activeItem.real_item_history.push({
          key: decryptObject.key,
          buyer: decryptObject.buyer,
          openseaTokenId: decryptObject.openseaTokenId,
          date: decryptObject.date,
          location: {  // will be comed as hashed will not be tamperable
            latitude: decryptObject.location.latitude,
            longitude: decryptObject.location.longitude
          }
        });

        activeItem.save();
        return callback(null, activeItem)
      })
    } else {
      return callback("bad_request", null);
    }
  } else {
    return callback("bad_request", null);
  }
}

const ActiveItem = mongoose.model("ActiveItem", activeItemSchema);

module.exports = ActiveItem
