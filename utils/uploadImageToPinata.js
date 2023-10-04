
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
require("dotenv").config();
const stream = require("stream");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataSecretApiKey);


const uploadImageToPinata = async (body) => {
  try {

    console.log("preparing data...");

    const Readable = stream.Readable;
    const base64Stream = new Readable();
    base64Stream.push(Buffer.from(body.data, 'base64'));
    base64Stream.push(null);


    console.log("data prepared...")

    const response = await pinata.pinFileToIPFS(base64Stream, {
      pinataMetadata: {
        name: body.name,
      }
    });


    return response.IpfsHash;
  } catch (error) {
    console.error('Error uploading image to Pinata:', error);
    return null;
  }
}

module.exports = { uploadImageToPinata };