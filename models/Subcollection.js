
const mongoose = require("mongoose");

const subcollectionSchema = new mongoose.Schema({
  itemId: {
    type: String
  },
  name: {
    type: String
  },
  charityAddress: {
    type: String
  },
  charityName: {
    type: String
  },
  properties: [
    property = {
      type: String
    }
  ],
  image: {
    type: String
  },
  totalRaised: {
    type: Number,
    default: 0
  }
});

subcollectionSchema.statics.createSubcollection = function (body, callback) {
  const newSubcollection = new subcollection(body);
  if (newSubcollection) {
    newSubcollection.save();
    return callback(null, newSubcollection);
  }
  return callback("bad_request");
}

const subcollection = mongoose.model("subcollection", subcollectionSchema);

module.exports = subcollection
