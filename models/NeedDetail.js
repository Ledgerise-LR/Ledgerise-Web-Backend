
const mongoose = require("mongoose");

const needDetailSchema = new mongoose.Schema({
  beneficiaryPhoneNumber: {
    type: String
  },
  depotAddress: {
    type: String
  },
  beneficiaryAddress: {
    type: String
  },
  orderNumber: {
    type: String
  },
  donorPhoneNumber: {
    type: String
  },
  donateTimestamp: {
    type: Number
  },
  needTokenId: {
    type: Number
  },
  quantitySatisfied: {
    type: Number
  }
});

needDetailSchema.statics.addNewNeedDetail = function (body, callback) {
  const newNeedDetail = new NeedDetail(body);
  if (newNeedDetail) {
    newNeedDetail.save();
    return callback(null, newNeedDetail);
  }
  return callback("bad_request");
}

const NeedDetail = mongoose.model("needDetail", needDetailSchema);

module.exports = NeedDetail;
