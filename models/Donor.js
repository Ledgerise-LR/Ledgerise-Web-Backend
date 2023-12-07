

const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema({

  school: {
    type: String,
    default: "UAA"
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  school_number: {
    type: Number,
    unique: true,
    required: true
  },

  password: {
    type: String,
    trim: true,
    required: true
  },

  phone_number: {
    type: String,
    trim: true,
    required: true,
    unique: true
  },

  national_identification_number: {
    type: String,
    trim: true,
    required: true
  },

  name: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  }
});

donorSchema.statics.createNewDonor = function (body, callback) {
  const newDonor = new Donor(body);
  if (newDonor) {
    newDonor.save();
    return callback(null, newDonor);
  }
  return callback("bad_request");
}

donorSchema.statics.loginDonor = function (body, callback) {
  Donor.findOne({ email: body.email }, (err, donor) => {
    if (err) return callback("bad_request");
    if (donor && body.password == donor.password) return callback(null, donor);
    return callback("verify_error")
  })
}

const Donor = mongoose.model("donor", donorSchema);

module.exports = Donor

