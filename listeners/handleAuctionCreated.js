
const AuctionItem = require("../models/AuctionItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.JsonRpcProvider(process.env.URL);

module.exports = () => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
  marketplace.on("AuctionCreated", (nftAddress, tokenId, interval, charityAddress, currentBidding, currentBidder, startTimeStamp, tokenUri, sender) => {
    const body = {
      nftAddress,
      tokenId,
      interval,
      charityAddress,
      currentBidder,
      currentBidding,
      startTimeStamp,
      tokenUri
    }
    AuctionItem.createAuctionItem(body, (err, auctionItem) => {
      if (err) return console.log("Auction item couldn't created");
      const currentDate = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
      const historyData = {
        key: "create",
        date: formattedDate,
        price: currentBidding.toString()
      }
      auctionItem.history.push(historyData);
      console.log(sender);
      if (auctionItem) return console.log(`Auction item created with tokenId: ${auctionItem.tokenId}`);
    })
  })
}
