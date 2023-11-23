
const Report = require("../models/Report");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/abi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.JsonRpcProvider(process.env.URL);

module.exports = async () => {
  const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
  marketplace.on("ReportCreated", (reporter, message, reportCodes, timestamp) => {

    const args = {
      reporter: reporter.toString(),
      message: message.toString(),
      reportCodes: parseInt(reportCodes),
      timestamp: parseInt(timestamp)
    }
    Report.createNewReport(args, (err, newReport) => {
      if (err) return console.err("An error occured while receiving the report.");
      return { success: true, newReport };
    })
  })
}