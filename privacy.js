
const axios = require("axios");
const { SERVER_URL, PORT } = require("./utils/serverUrl");
const PATH_NAME = "/privacy/blur-visual";

let receivedData = "";

const processImage = (ipfsGatewayTokenUri, bounds) => {
  return new Promise((resolve, reject) => {

    const url = `${SERVER_URL}:${PORT}/privacy/blur`
    axios.post(url, {
      tokenUri: ipfsGatewayTokenUri,
      bounds: bounds
    })
      .then(res => {
        const data = JSON.parse(res.data);
        resolve(data["image"]);
      })
  });
}


const receiveImage = (app) => {
  app.get(PATH_NAME, async (req, res) => {
    receivedData = "";
    const ipfsGatewayTokenUri = req.query.ipfsGatewayTokenUri;
    const bounds = {
      x: parseFloat(req.query.x),
      y: parseFloat(req.query.y)
    }
    if (ipfsGatewayTokenUri) {
      const processedImageData = await processImage(ipfsGatewayTokenUri, bounds);
      return res.status(200).json({ success: true, data: processedImageData });
    }
    return res.status(400).json({ success: false, data: "bad_request" });
  })
}

module.exports = { receiveImage };
