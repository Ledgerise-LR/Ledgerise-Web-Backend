
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
const subcollection = require("../models/Subcollection");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);

module.exports = async () => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
  marketplace.on("ItemBought", (buyer, nftAddress, tokenId, price, openseaTokenId) => {
    ActiveItem.findOne({ itemId: getIdFromParams(nftAddress, tokenId) }, (err, activeItem) => {
      if (err) return console.log("bought_failed");
      activeItem.buyer = buyer.toString();
      activeItem.availableEditions -= 1;
      activeItem.tokenId = tokenId;

      const currentDate = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;

      const historyObject = {
        key: "buy",
        date: formattedDate,
        price: price,
        buyer: buyer,
        openseaTokenId: openseaTokenId.toNumber()
      }
      activeItem.history.push(historyObject);

      activeItem.save();

      subcollection.findOne({ subcollectionId: activeItem.subcollectionId }, (err, subcollection) => {
        if (err) return console.log("bought_failed");
        subcollection.totalRaised += activeItem.price;
        subcollection.save();
      })
    })
  });
}