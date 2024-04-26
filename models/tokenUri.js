
const mongoose = require("mongoose");
const formidable = require("formidable");
const { storeImages, storeUriMetadata } = require("../utils/uploadToPinata")

const tokenUriSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  tokenUri: {
    type: String,
    required: true
  },
  companyCode: {
    type: String
  }
});

tokenUriSchema.statics.addNewTokenUri = function (body, callback) {
  const newTokenUri = new TokenUri(body);
  if (newTokenUri) {
    newTokenUri.save();
    return callback(null, newTokenUri);
  }
  return callback("bad_request");
}


tokenUriSchema.statics.createTokenUri = async function (req, callback) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return callback('Error uploading file to pinata');
    }

    const imageData = fields.image[0];
    const imageName = fields.name[0];
    const description = fields.description[0];
    const attributesString = fields.attributes[0];

    const metadataTemplate = {
      "name": imageName,
      "description": description,
      "image": "",
      "attributes": []
    }

    for (let i = 0; i < attributesString.split(",").length; i++) {
      const array = attributesString.split(",");
      const key = array[i].split(":")[0];
      const value = parseFloat(array[i].split(":")[1]);

      const tempAttributeObject = {
        trait_type: key,
        value: value
      };

      metadataTemplate["attributes"].push(
        tempAttributeObject
      );
    }

    const tokenUris = [];

    const body = {
      name: imageName,
      data: imageData.split(",")[1]
    }

    const { responses: imageUploadResponses } = await storeImages(body);

    for (const imageUploadResponsesIndex in imageUploadResponses) {
      // create metadata
      // uploadMetadata
      let tokenUriMetadata = { ...metadataTemplate };
      tokenUriMetadata["image"] = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`;
      console.log(`Uploading ${tokenUriMetadata.name}`);

      const metaDataUploadResponse = await storeUriMetadata(tokenUriMetadata);
      tokenUris.push(`ipfs://${metaDataUploadResponse.IpfsHash}`);
    }

    TokenUri.addNewTokenUri({ name: imageName, tokenUri: tokenUris[0], companyCode: req.session.company.code }, (err, newTokenUri) => {
      if (err) return callback("bad_request");
      return callback(null, newTokenUri);
    });
  });
}

const TokenUri = mongoose.model("tokenUri", tokenUriSchema);

module.exports = TokenUri
