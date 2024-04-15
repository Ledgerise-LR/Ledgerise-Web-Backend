

const mongoose = require("mongoose");

const donorSchema = new mongoose.Schema({

  // school: {
  //   type: String,
  //   default: "UAA"
  // },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  school_number: {
    type: String,
  },

  password: {
    type: String,
    trim: true,
    required: true
  },

  phone_number: {
    type: String,
    trim: true,
  },

  // national_identification_number: {
  //   type: String,
  //   trim: true,
  //   required: true
  // },

  // name: {
  //   type: String,
  //   required: true
  // },
  // surname: {
  //   type: String,
  //   required: true
  // }
});

donorSchema.statics.createNewDonor = function (body, callback) {
  const donorBody = {
    email: body.email,
    phone_number: body.phone_number,
    school_number: body.phone_number,
    password: body.password
  }
  Donor.findOne({email: body.email}, (err, donor) => {
    if (donor) return callback("duplicate_key");
    if (!donor) {
      const newDonor = new Donor(donorBody);
      if (newDonor) {
        newDonor.save();
        return callback(null, newDonor);
      }
      return callback("bad_request");  
    }
  })
}

donorSchema.statics.loginDonor = function (body, callback) {
  Donor.findOne({ email: body.email }, (err, donor) => {
    if (err) return callback("bad_request");
    if (donor && body.password == donor.password) return callback(null, donor);
    return callback("verify_error")
  })
}

donorSchema.statics.authenticateDonor = function (body, callback) {
  Donor.findById(body._id, (err, donor) => {
    if (err || !donor) return callback("auth_error");
    return callback(null, donor);
  })
}

const Donor = mongoose.model("donor", donorSchema);

module.exports = Donor

