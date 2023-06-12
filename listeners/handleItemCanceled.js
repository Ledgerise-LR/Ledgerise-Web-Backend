
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("ws");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.JsonRpcProvider(process.env.URL);

module.exports = async () => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
  marketplace.on("ItemCanceled", (buyer, nftAddress, tokenId, price) => {
    ActiveItem.findOne({ itemId: getIdFromParams(nftAddress, tokenId) }, (err, activeItem) => {
      if (err) return console.log("cancel_failed");
      activeItem.buyer = Address.fromString("0x000000000000000000000000000000000000dEaD");
      activeItem.save();
    });
  });
}
