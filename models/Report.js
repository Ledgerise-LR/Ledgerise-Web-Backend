
const ethers = require("ethers");
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);
const signer = new ethers.Wallet(
  `0x${process.env.OWNER_PRIVATE_KEY}`,
  provider
)


const reportSchema = new mongoose.Schema({
  reporter: {
    type: String,
    required: true,
    lowercase: true
  },
  message: {
    type: String,
    required: true
  },

  reportCodes: [
    reportCode = {
      type: Number,
      unique: true,
      required: true
    }
  ],

  timestamp: {
    type: Number,
    required: true
  },

  transaction_hash: {
    type: String,
    required: true,
    trim: true
  }
});

reportSchema.statics.createNewReport = async function (body, callback) {
  const newReport = new Report(body);

  if (newReport) {

    const marketplace = new ethers.Contract(marketplaceAddress, abi, signer);

    try {

      const reportIssueTx = await marketplace.connect(signer).reportIssue(
        body.reporter,
        body.message,
        body.reportCodes
      );

      const reportIssueTxReceipt = await reportIssueTx.wait(1);
      newReport.transaction_hash = reportIssueTxReceipt.transactionHash;
      await newReport.save();
      console.log(reportIssueTxReceipt.transactionHash);
      return callback(null, newReport);

    } catch (error) {
      console.log(error);
      return callback("bad_request");
    }
  }
}

const Report = mongoose.model("Report", reportSchema);

module.exports = Report
