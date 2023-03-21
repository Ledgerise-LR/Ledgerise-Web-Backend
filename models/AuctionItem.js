
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abis = require("../constants/abi.json");

const auctionItemSchema = new mongoose.Schema({
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
    type: String
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
  }
});

auctionItemSchema.statics.createAuctionItem = function (body, callback) {
  const newAuctionItem = new AuctionItem(body);
  if (newAuctionItem) {
    newAuctionItem.save();
    return callback(null, newAuctionItem);
  }
  return callback("bad_request");
}

const AuctionItem = mongoose.model("AuctionItem", auctionItemSchema);

module.exports = AuctionItem
