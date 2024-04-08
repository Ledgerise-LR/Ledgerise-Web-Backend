const Subcollection = require("../models/Subcollection.js");
const ethers = require("ethers");
const networkMapping = require("../constants/networkMapping.json");
const abi = require("../constants/mainCollectionAbi.json");
const { getIdFromParams } = require("../utils/getIdFromParams");
require("dotenv").config();

const mainCollectionAddress = networkMapping["MainCollection"][process.env.ACTIVE_CHAIN_ID];
const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
const ledgeriseLensAddress = networkMapping["LedgeriseLens"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.JsonRpcProvider(process.env.URL);

module.exports = async () => {
  const mainCollection = new ethers.Contract(mainCollectionAddress, abi, provider);
  mainCollection.on("SubcollectionCreated", (id, name, charityAddress, properties) => {

    Subcollection.findOne({ nftAddress: mainCollectionAddress, itemId: id }, (err, subcollection) => {
      if (err || subcollection) {
        console.log("bad_request");
        return null;
      }

      if (!subcollection) {
        const body = {
          itemId: id.toString(),
          name: name.toString(),
          charityAddress: charityAddress.toString(),
          nftAddress: mainCollectionAddress,
          marketplaceAddress: marketplaceAddress,
          ledgeriseLensAddress: ledgeriseLensAddress,
          providerUrl: process.env.URL
        }
        Subcollection.createSubcollection(body, (err, newSubcollection) => {
          if (err) {
            console.log("bad_request");
            return null;
          } else {
            console.log(`Subcollection created with id ${newSubcollection.itemId}`);
            return true;
          }
        })
      }
    })
  })
}