
const mongoose = require("mongoose");

const depotLocationSchema = new mongoose.Schema({
 
  depotName: {
    type: String
  },

  depotLocation: {
    latitude: {
      type: Number
    }, 
    longitude: {
      type: Number
    }
  }
});

const DepotLocation = mongoose.model("depotLocation", depotLocationSchema);

module.exports = DepotLocation
