
const Subcollection = require("../models/Subcollection");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

module.exports = (realItemHistoryData, callback) => {
  
  Subcollection.findOne({ nftAddress: realItemHistoryData.nftAddress, itemId: realItemHistoryData.subcollectionId }, async (err, subcollection) => {

    if (err) return callback("bought_failed");

    const marketplaceAddress = subcollection.marketplaceAddress;
    const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

    const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
    const signer = new ethers.Wallet(
      `0x${process.env.OWNER_PRIVATE_KEY}`,
      provider
    );

    const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

    try {

      const saveItemToRealHistoryTx = await marketplace.connect(signer).saveRealItemHistory(
        realItemHistoryData.nftAddress,
        parseInt(realItemHistoryData.openseaTokenId),
        realItemHistoryData.key,
        realItemHistoryData.buyer,
        realItemHistoryData.date,
        parseInt(realItemHistoryData.openseaTokenId),
        realItemHistoryData.location.latitude,
        realItemHistoryData.location.longitude,
        realItemHistoryData.location.decimals,
        realItemHistoryData.visualVerificationTokenId
      );

      const saveItemToRealHistoryTxReceipt = await saveItemToRealHistoryTx.wait(1);

      const transactionHash = saveItemToRealHistoryTxReceipt.transactionHash;
      return callback(null, transactionHash);
    } catch (error) {
      console.log(error);
    }
  })
}

