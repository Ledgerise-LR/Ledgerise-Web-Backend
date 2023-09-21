
const VisualVerification = require("../models/VisualVerification");
const async = require("async");
const { uploadImageToPinata } = require("../utils/uploadImageToPinata");
const mintVerification = require("../utils/mintVerification");
const saveRealItemHistory = require("../listeners/saveRealItemHistory");

module.exports = (callback) => {

  const eventDataArray = [];

  VisualVerification.find({ isUploadedToBlockchain: false }, (err, visualVerifications) => {
    if (err) return callback(err);
    if (visualVerifications) {
      async.timesSeries(visualVerifications.length, async (i, next) => {
        const visualVerification = visualVerifications[i];

        const base64String = visualVerification.base64_image;

        const ipfsHash = await uploadImageToPinata(base64String);

        visualVerification.base64_image = "";
        visualVerification.tokenUri = ipfsHash;

        const visualVerificationTokenId = await mintVerification(
          visualVerification.openseaTokenId,
          visualVerification.tokenUri,
          visualVerification.buyer,
          visualVerification.key
        );

        visualVerification.visualVerificationTokenId = visualVerificationTokenId;

        const realItemHistoryData = {
          key: visualVerification.key,
          buyer: visualVerification.buyer,
          visualVerificationTokenId: visualVerificationTokenId,
          openseaTokenId: visualVerification.openseaTokenId,
          date: visualVerification.date,
          location: {
            latitude: visualVerification.location.latitude,
            longitude: visualVerification.location.longitude
          },
          transactionHash: ""
        }

        eventDataArray.push(realItemHistoryData);

      }, (err) => {
        if (err) return callback(err);

        return eventDataArray;
      });
    }
  })
}
