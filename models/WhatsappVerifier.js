
const mongoose = require("mongoose");

const whatsappVerifierSchema = new mongoose.Schema({

  phone_number: {
    type: String,
    required: true
  },

  telegramId: {
    type: String,
    required: true
  },

  qrCodeData: {
    type: String,
    required: true
  },

  nftAddress: {
    type: String,
    required: true
  },

  subcollectionId: {
    type: String,
    required: true
  },

  isVerified: {
    type: Boolean,
    default: false
  }
});

whatsappVerifierSchema.statics.createWhatsappVerifier = function(body, callback) {
  const newWhatsappVerifier = new WhatsappVerifier(body);
  if (newWhatsappVerifier) {
    newWhatsappVerifier.save();
    return callback(null, newWhatsappVerifier);
  }
  return callback("failed_to_create");
}

const WhatsappVerifier = mongoose.model("WhatsappVerifier", whatsappVerifierSchema);

module.exports = WhatsappVerifier;
