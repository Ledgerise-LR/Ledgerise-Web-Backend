
const mongoose = require("mongoose");

const visualVerificationSchema = new mongoose.Schema({
  buyer: {
    type: String,
    default: "0x",
    required: true
  },
  key: {  // stamp, shipped, delivered
    type: String,
    default: "nokey",
    required: true
  },
  openseaTokenId: {
    type: String,
    required: true
  },
  tokenId: {
    type: Number,
    required: true
  },
  base64_image: {
    type: String,
    default: ""
  },
  tokenUri: {
    type: String,
    default: ""
  },
  isUploadedToBlockchain: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  isVerificationMinted: {
    type: Boolean,
    default: false
  }
});

visualVerificationSchema.statics.createVisualVerification = function (body, callback) {
  const newVisualVerification = new visualVerification(body);
  if (newVisualVerification) {
    newVisualVerification.save();
    return callback(null, newVisualVerification);
  }
  return callback("bad_request");
}

const visualVerification = mongoose.model("visualverification", visualVerificationSchema);

module.exports = visualVerification
