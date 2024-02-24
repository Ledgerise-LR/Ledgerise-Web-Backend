
const VisualVerification = require("../models/VisualVerification");
const async = require("async");
const { uploadImageToPinata } = require("./uploadImageToPinata");
const mintVerification = require("./mintVerification");
const saveRealItemHistory = require("../listeners/saveRealItemHistory");
const networkMapping = require("../constants/networkMapping.json");

const nftAddress = networkMapping["MainCollection"]["11155111"];

const eventDataArray = [];

module.exports = (callback) => {

  VisualVerification.find({ isUploadedToBlockchain: false }, (err, visualVerifications) => {
    if (err) return callback(err);
    if (visualVerifications.length >= 1) {

      async.timesSeries(visualVerifications.length, async (i, next) => {
        const visualVerification = visualVerifications[i];

          const body = {
            name: `${visualVerification.buyer}_${visualVerification.openseaTokenId}_${visualVerification.key}`,
            data: Buffer.from(visualVerification.base64_image, "base64")
          }

          if (!visualVerification.visualVerificationTokenId) {
            const ipfsHash = await uploadImageToPinata(body);

            visualVerification.tokenUri = ipfsHash;
            // visualVerification.base64_image = "";

            const { tokenId, transactionHash } = await mintVerification(
              visualVerification.openseaTokenId,
              visualVerification.tokenUri,
              visualVerification.buyer,
              visualVerification.key
            );

            visualVerification.visualVerificationTokenId = tokenId;
            visualVerification.transactionHash = transactionHash;
          };


          const realItemHistoryData = {
            visualVerificationItemId: visualVerification._id,
            nftAddress: nftAddress,
            marketplaceTokenId: visualVerification.tokenId,
            key: visualVerification.key,
            buyer: visualVerification.buyer,
            visualVerificationTokenId: visualVerification.visualVerificationTokenId,
            openseaTokenId: visualVerification.openseaTokenId,
            date: visualVerification.date,
            location: {
              latitude: parseInt((visualVerification.location.latitude) * 1000),
              longitude: parseInt((visualVerification.location.longitude) * 1000),
              decimals: 3
            },
            transactionHash: ""
          }

          visualVerification.isVerificationMinted = true;


          eventDataArray.push(realItemHistoryData);
          visualVerification.save();
          return next();
      }, (err) => {
        return callback(null, eventDataArray)
      });
    }
  })
}
