
const pinataSdk = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSdk(pinataApiKey, pinataApiSecret);
const stream = require("stream");

async function storeImages(body) {

  console.log("Uploading to Pinata...");

  const Readable = stream.Readable;
  const base64Stream = new Readable();
  base64Stream.push(Buffer.from(body.data, 'base64'));
  base64Stream.push(null); // End the stream


  let responses = [];
  try {
    const response = await pinata.pinFileToIPFS(base64Stream, {
      pinataMetadata: {
        name: body.name,
      }
    });
    responses.push(response);
  } catch (e) {
    console.log(e);
  }

  console.log(responses)
  return { responses };
}

async function storeUriMetadata(body) {
  try {
    const response = await pinata.pinJSONToIPFS(body);
    return response;
  } catch (e) {
    console.log(e);
  }
  return null;
}

module.exports = { storeImages, storeUriMetadata };
