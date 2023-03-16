
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);

module.exports = async () => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
  marketplace.on("ItemListed", (seller, nftAddress, tokenId, charityAddress, price, tokenUri) => {
    const itemId = getIdFromParams(nftAddress, tokenId);
    const args = {
      itemId: itemId,
      seller: seller.toString(),
      buyer: "0x0000000000000000000000000000000000000000",
      nftAddress: nftAddress.toString(),
      tokenId: tokenId.toNumber(),
      charityAddress: charityAddress.toString(),
      price: price.toString(), // 18 decimals (Wei)
      tokenUri: tokenUri.toString() // will be uploaded to pinata from react
    }

    ActiveItem.findOne({ itemId: itemId }, (err, activeItemFetched) => {
      if (err) return "item_already_exit";
      if (activeItemFetched) {
        activeItemFetched.itemId = itemId;
        activeItemFetched.tokenId = tokenId;
        activeItemFetched.seller = seller;
        activeItemFetched.nftAddress = nftAddress;
        activeItemFetched.price = price;
        activeItemFetched.tokenUri = tokenUri
        activeItemFetched.save();
      } else if (!activeItemFetched) {
        ActiveItem.createActiveItem(args, (err, newActiveItem) => {
          if (err) return "item_creation_fail";
          if (newActiveItem) {
            console.log(`activeItem created with id: ${newActiveItem.itemId}`);
          }
        })
      }
    })
  })
}