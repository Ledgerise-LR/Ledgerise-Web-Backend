
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/ledgeriseLensAbi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const ledgeriseLensAddress = networkMapping["LedgeriseLens"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);
const signer = new ethers.Wallet(
  `0x${process.env.OWNER_PRIVATE_KEY}`,
  provider
)

module.exports = async (openseaTokenId, tokenUri, buyer, key) => {
  const ledgeriseLens = new ethers.Contract(ledgeriseLensAddress, abi, signer);

  try {

    const mintVerificationTx = await ledgeriseLens.connect(signer).mintVisualNft(
      openseaTokenId,
      tokenUri,
      buyer,
      key
    );

    const mintVerificationTxReceipt = await mintVerificationTx.wait(1);
    return {
      tokenId: mintVerificationTxReceipt.events[1].args.tokenCounter,
      transactionHash: mintVerificationTx.transactionHash
    };
  } catch (error) {
    console.log(error);
  }
}

