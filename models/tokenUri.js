
const mongoose = require("mongoose");

const tokenUriSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tokenUri: {
    type: String,
    required: true
  }
});

tokenUriSchema.statics.addNewTokenUri = function (body, callback) {
  const newTokenUri = new tokenUri(body);
  if (newTokenUri) {
    newTokenUri.save();
    return callback(null, newTokenUri);
  }
  return callback("bad_request");
}

const tokenUri = mongoose.model("tokenUri", tokenUriSchema);

module.exports = tokenUri
