
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

    const ledgeriseLensAddress = "0x5B6f403547dB80d67120aa2b3F8148c556C86fa6";
    const ledgeriseLensAbi = require(`../constants/abis/0x5B6f403547dB80d67120aa2b3F8148c556C86fa6.json`);

    const ledgeriseLens = new ethers.Contract(ledgeriseLensAddress, ledgeriseLensAbi, signer);

    try {

      const tokenCounter = await ledgeriseLens.connect(signer).getTokenCounter();
      const tokenCounterInteger = tokenCounter.toNumber();

      const mintVerificationTx = await ledgeriseLens.connect(signer).mintVisualNft(
        parseInt(openseaTokenId),
        tokenUri,
        buyer,
        EVENT_DATA[key]
      );

      console.log("hello 1")

      const mintVerificationTxReceipt = await mintVerificationTx.wait(1);

      console.log("hello")

      console.log(mintVerificationTxReceipt.transactionHash)

      return {
        tokenId: tokenCounterInteger,
        transactionHash: mintVerificationTxReceipt.transactionHash
      };
    } catch (error) {
      console.log(error);
    }
}

