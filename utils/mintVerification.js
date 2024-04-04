
const ActiveItem = require("../models/ActiveItem");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");

const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const EVENT_DATA = {
  "stamp": 0,
  "shipped": 1,
  "delivered": 2
};

const provider = new ethers.providers.WebSocketProvider(process.env.URL);
const signer = new ethers.Wallet(
  `0x${process.env.OWNER_PRIVATE_KEY}`,
  provider
)

module.exports = async (openseaTokenId, tokenUri, buyer, key, tokenId) => {

  ActiveItem.findOne({/*nftAddress: nftAddress,*/ tokenId: tokenId}, async (err, activeItem) => {

    const ledgeriseLensAddress = activeItem.ledgeriseLensAddress;
    const ledgeriseLensAbi = require(`../constants/abis/${ledgeriseLensAddress}.json`);

    const ledgeriseLens = new ethers.Contract(ledgeriseLensAddress, ledgeriseLensAbi, signer);

    try {

      const mintVerificationTx = await ledgeriseLens.connect(signer).mintVisualNft(
        parseInt(openseaTokenId),
        tokenUri,
        buyer,
        EVENT_DATA[key]
      );

      const mintVerificationTxReceipt = await mintVerificationTx.wait(1);

      return {
        tokenId: mintVerificationTxReceipt.events[1].args.tokenCounter,
        transactionHash: mintVerificationTxReceipt.transactionHash
      };
    } catch (error) {
      console.log(error);
    }
  })
}

