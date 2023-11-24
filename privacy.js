
const { spawn } = require("child_process");

const PATH_NAME = "/privacy/blur-visual";
const BLUR_AID_PARCEL_DIR = "../LedgeriseLens-AI/getBlur.py";

let receivedData = "";

const processImage = (ipfsGatewayTokenUri) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [BLUR_AID_PARCEL_DIR]);

    pythonProcess.stdin.write(ipfsGatewayTokenUri);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {

      const resData = data.toString().trim();
      if (resData == "end") resolve(receivedData)
      else if (resData != "end") receivedData += resData;
    })

    pythonProcess.stderr.on("data", (data) => {
      const processedImage = data.toString().trim();
      console.error(processedImage);
    })
  });
}


const receiveImage = (app) => {
  app.get(PATH_NAME, async (req, res) => {
    receivedData = "";
    const ipfsGatewayTokenUri = req.query.ipfsGatewayTokenUri;
    if (ipfsGatewayTokenUri) {
      const processedImageData = await processImage(ipfsGatewayTokenUri);
      return res.status(200).json({ success: true, data: processedImageData });
    }
    return res.status(400).json({ success: false, data: "bad_request" });
  })
}

module.exports = { receiveImage };
