
const mongoose = require("mongoose");
const axios = require("axios");
const base64 = require("base-64");

const cargoCompanySchema = new mongoose.Schema({

  name: {
    type: String,
    default: ""
  },

  api_key: {
    type: String,
    default: ""
  },
});

cargoCompanySchema.statics.addNewCargoCompany = function (body, callback) {
  const newCargoCompany = new CargoCompany(body);
  if (newCargoCompany) {
    newCargoCompany.save();
    return callback(null, newCargoCompany);
  }
  return callback("bad_request");
}

cargoCompanySchema.statics.getOrderDetails = function (body, callback) {

  CargoCompany.findById(body.cargoCompanyId, (err, cargoCompany) => {

    if (err) return callback(err);

    const options = {
      method: 'GET',
      url: `https://oms-external-sit.hepsiburada.com/orders/merchantid/${body.merchantId}/ordernumber/${body.orderNumber}`,
      headers: {
        accept: 'application/json',
        authorization: `Basic ${base64.encode(`${body.username}${body.password}`)}`
      }
    };

    axios
      .request(options)
      .then(function (response) {
        return callback(null, response.data);
      })
      .catch(function (error) {
        return callback(error);
      });
  })
}

const CargoCompany = mongoose.model("cargoCompany", cargoCompanySchema);

module.exports = CargoCompany;
