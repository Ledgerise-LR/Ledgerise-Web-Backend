
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abis = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");

const auctionItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    reqired: true,
    trim: true,
    unique: true
  },
  seller: {
    type: String,
  },
  nftAddress: {
    type: String
  },
  charityAddress: {
    type: String
  },
  tokenId: {
    type: Number
  },
  currentBidding: {
    type: String
  },
  currentBidder: {
    type: String,
    default: ""
  },
  interval: {
    type: String
  },
  state: {
    type: String,
    enum: ["OPEN", "ENDED"]
  },
  tokenUri: {
    type: String
  },
  creator: {
    type: String
  },
  history: [
    event = {
      key: {
        type: String  // create, bid, complete
      },
      date: {
        type: String
      },
      price: {
        type: String
      },
      bidder: {
        type: String
      },
      winner: {
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
  startTime: {
    type: String,
    default: Date.now
  },
  attributes: []
});

auctionItemSchema.statics.createAuctionItem = function (body, callback) {
  const newAuctionItem = new AuctionItem(body);
  if (newAuctionItem) {
    newAuctionItem.itemId = getIdFromParams(newAuctionItem.nftAddress, newAuctionItem.tokenId);
    newAuctionItem.save();
    return callback(null, newAuctionItem);
  }
  return callback("bad_request");
}

const AuctionItem = mongoose.model("AuctionItem", auctionItemSchema);

module.exports = AuctionItem
