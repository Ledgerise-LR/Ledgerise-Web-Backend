
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);
const signer = new ethers.Wallet(
  `0x${process.env.OWNER_PRIVATE_KEY}`,
  provider
)

module.exports = async (realItemHistoryData) => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, signer);

  console.log("hello")

  try {

    const saveItemToRealHistoryTx = await marketplace.connect(signer).saveRealItemHistory(
      realItemHistoryData.nftAddress,
      realItemHistoryData.marketplaceTokenId,
      realItemHistoryData.key,
      realItemHistoryData.buyer,
      realItemHistoryData.date,
      realItemHistoryData.openseaTokenId,
      realItemHistoryData.location.latitude,
      realItemHistoryData.location.longitude,
      realItemHistoryData.location.decimals,
      realItemHistoryData.visualVerificationTokenId
    );

    const saveItemToRealHistoryTxReceipt = await saveItemToRealHistoryTx.wait(1);
    console.log(saveItemToRealHistoryTxReceipt.transactionHash);
    return saveItemToRealHistoryTxReceipt.transactionHash
  } catch (error) {
    console.log(error);
  }
}

