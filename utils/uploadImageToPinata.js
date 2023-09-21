
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);


async function uploadImageToPinata(base64Image) {
  try {
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const { IpfsHash } = await pinata.pinFileToIPFS(imageBuffer);

    return IpfsHash;
  } catch (error) {
    console.error('Error uploading image to Pinata:', error);
    return null;
  }
}

module.exports = { uploadImageToPinata };