
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
  marketplace.on("ItemListed", (seller, nftAddress, tokenId, charityAddress, price, tokenUri, subcollectionId) => {
    const itemId = getIdFromParams(nftAddress, tokenId);
    const args = {
      itemId: itemId,
      seller: seller.toString(),
      buyer: "0x0000000000000000000000000000000000000000",
      nftAddress: nftAddress.toString(),
      tokenId: tokenId.toNumber(),
      charityAddress: charityAddress.toString(),
      price: price.toString(), // 18 decimals (Wei)
      tokenUri: tokenUri.toString(), // will be uploaded to pinata from react
      subcollectionId: subcollectionId.toString()
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
        activeItemFetched.subcollectionId = subcollectionId
        const currentDate = new Date();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
        activeItemFetched.history.push({
          key: "update",
          date: formattedDate,
          price: price
        })
        activeItemFetched.save();
      } else if (!activeItemFetched) {
        ActiveItem.createActiveItem(args, (err, newActiveItem) => {
          if (err) return "item_creation_fail";
          if (newActiveItem) {
            const currentDate = new Date();
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
            newActiveItem.history.push({
              key: "list",
              date: formattedDate,
              price: price
            })
            console.log(`activeItem created with id: ${newActiveItem.itemId}`);
          }
        })
      }
    })
  })
}