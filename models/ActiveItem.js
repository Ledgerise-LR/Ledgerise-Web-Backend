
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abis = require("../constants/abi.json");
const { storeImages, storeUriMetadata } = require("../utils/uploadToPinata");
const { ethers } = require("ethers")

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
        type: String  // stamped, shipped, delivered
      },
      buyer: {  // Included in qr code
        type: String
      },
      openseaTokenId: {  // Included in qr code
        type: Number
      },
      date: {
        type: Number
      },
      location: {  // will be comed as hashed will not be tamperable
        type: String
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
    console.log(editionRange)
    editionFilters = editionRange.split(",").map(range => {
      const [min, max] = range.split("-");
      return {
        availableEditions: { $gte: parseInt(min), $lte: parseInt(max) }
      };
    });
    console.log(editionFilters)
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

  console.log("-----------");
  console.log(filters.$or);

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
  console.log(body);
}

const ActiveItem = mongoose.model("ActiveItem", activeItemSchema);

module.exports = ActiveItem
