
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abis = require("../constants/abi.json");
const { ethers } = require("ethers");
const CryptoJS = require("crypto-js");
const async = require("async");
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

function getFiltersByQueries(priceRange, editionRange) {

  const filters = {
    priceFilters: [],
    editionFilters: []
  }

  priceRange
    ? priceRange.split(",").forEach(element => {
      filters.priceFilters.push(element)
    })
    : ""

  editionRange
    ? editionRange.split(",").forEach(element => {
      filters.editionFilters.push(element)
    })
    : ""


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


let priceFilteredArray = [];
let editionFilteredArray = [];

activeItemSchema.statics.sortDefault = function (body, callback) {

  priceFilteredArray = [];
  editionFilteredArray = [];

  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter);
  ActiveItem.find({
    subcollectionId: body.subcollectionId,
  }, (err, activeItems) => {

    if (err) return callback(err);

    if (filters.priceFilters[0] == undefined && filters.editionFilters[0] == undefined) return callback(null, activeItems)

    filters.priceFilters[0] != undefined

      ? async.timesSeries(activeItems.length, (i, next) => {
        const activeItem = activeItems[i];
        const price = parseFloat(ethers.utils.formatEther(activeItem.price, "ether"));

        let flag = 0;

        filters.priceFilters.forEach(eachPriceFilter => {

          const [min, max] = eachPriceFilter.split("-");
          if (price >= parseFloat(min) && price <= parseFloat(max)) {
            flag = 1;
          }
        })

        if (flag) priceFilteredArray.push(activeItem);
        next();

      }, (err) => {
        if (err) return callback(err);
      })

      : priceFilteredArray = activeItems

    console.log(priceFilteredArray.length)

    filters.editionFilters[0] != undefined
      ? async.timesSeries(priceFilteredArray.length, (j, next) => {
        const activeItem = priceFilteredArray[j];
        const editions = activeItem.availableEditions;

        let flag = 0;

        filters.editionFilters.forEach(eachEditionFilter => {
          const [min, max] = eachEditionFilter.split("-");
          if (editions >= parseInt(min) && editions <= parseInt(max)) {
            flag = 1;
          }
        })

        if (flag) editionFilteredArray.push(activeItem);
        next();

      }, (err) => {
        if (err) return callback(err);
      })

      : editionFilteredArray = priceFilteredArray

    return callback(null, editionFilteredArray);

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
