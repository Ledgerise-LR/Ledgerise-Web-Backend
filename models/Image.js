
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  base64Data: {
    type: Buffer,
    required: true
  }
});

imageSchema.statics.addNewImage = function (body, callback) {
  const newImage = new tokenUri(body);
  if (newImage) {
    newImage.save();
    return callback(null, newImage);
  }
  return callback("bad_request");
}

const image = mongoose.model("image", imageSchema);

module.exports = image
