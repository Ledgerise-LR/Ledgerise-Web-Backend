
const socketIo = require("socket.io");
const { spawn } = require("child_process");


const PATH_NAME = "/realtime";
const PREDICT_DIR = "../LedgeriseLens-AI/detect.py";
const TEMP_IMAGE_DIR = "../Nft-Fundraising-nodejs-backend/temp_image.png"

const processImage = (imageBase64) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [PREDICT_DIR]);

    pythonProcess.stdin.write(imageBase64);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      const processedImage = data.toString().trim();
      resolve(processedImage)
    })

    pythonProcess.stderr.on("data", (data) => {
      const processedImage = data.toString().trim();
      reject(processedImage);
    })
  });
}

let tempBase64Image = ""

const connectRealTime = (server) => {
  const io = socketIo(server);
  const realtimeNamespace = io.of('/realtime');


  realtimeNamespace.on("connection", (socket) => {
    console.log(`Client connected to ${PATH_NAME}`);


    socket.on("cameraFrame", async (base64ImageData) => {
      if (base64ImageData != "done") {
        tempBase64Image += base64ImageData;
      } else if (base64ImageData == "done") {

        const processedImageData = await processImage(tempBase64Image);
        tempBase64Image = "";
        if (processedImageData != undefined) {
          const formattedProcessedImageData = processedImageData.replace(/'/g, '"')
          console.log(formattedProcessedImageData);
          await socket.emit('processedImage', JSON.parse(formattedProcessedImageData));
        }
      }
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected from ${PATH_NAME}`);
    })
  })
}

module.exports = { connectRealTime }
