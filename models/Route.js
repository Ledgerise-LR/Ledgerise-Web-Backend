
const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({

  stampLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    decimals: {
      type: Number,
      default: 3
    }
  }, shipLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    decimals: {
      type: Number,
      default: 3
    }
  }, deliverLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    decimals: {
      type: Number,
      default: 3
    }
  }

});

routeSchema.statics.addNewRoute = function (body, callback) {
  const newRoute = new route(body);
  if (newRoute) {
    newRoute.save();
    return callback(null, newRoute);
  }
  return callback("bad_request");
}

const route = mongoose.model("route", routeSchema);

module.exports = route
