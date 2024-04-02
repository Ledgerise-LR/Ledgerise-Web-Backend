
const mongoose = require("mongoose");

const needSchema = new mongoose.Schema({
  
  needTokenId: {
    type: Number,
    default: ""
  },

  name: {
    type: String
  },

  description: {
    type: String
  },

  quantity: {
    type: Number,
    default: ""
  },

  beneficiary_phone_number: {
    type: String,
    default: ""
  },

  timestamp: {
    type: Number,
    default: ""
  },

  currentSatisfiedNeedQuantity: {
    type: Number,
    defualt: 0
  },

  beneficiary_id: {
    type: mongoose.Types.ObjectId
  }
});

needSchema.statics.addNewNeed = function (body, callback) {
  const newNeed = new newNeed(body);
  if (newNeed) {
    newNeed.save();
    return callback(null, newNeed);
  }
  return callback("bad_request");
}

const Need = mongoose.model("need", needSchema);

module.exports = Need;

