
const socketIo = require("socket.io");
const { spawn } = require("child_process");
const fs = require("fs");


const PATH_NAME = "/realtime";
const PREDICT_DIR = "../LedgeriseLens-AI/detect.py";
const TEMP_IMAGE_DIR = "../Nft-Fundraising-nodejs-backend/temp_image.png"

const processImage = async (imageBase64) => {
  const pythonProcess = spawn("python3", [PREDICT_DIR, TEMP_IMAGE_DIR]);

  pythonProcess.stdout.on("data", (data) => {
    const processedImage = data.toString().trim();
    return processedImage
  })

  pythonProcess.stderr.on("data", (data) => {
    const processedImage = data.toString().trim();
    return processedImage
  })

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
        fs.writeFileSync('temp_image.png', Buffer.from(tempBase64Image, "base64"));

        const processedImageData = await processImage(tempBase64Image);
        console.log(processedImageData)
        if (processedImageData == "done") {
          console.log("hello")
          socket.emit("processedImage", processedImageData.toString().trim());
          tempBase64Image = "";

        }
      }
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected from ${PATH_NAME}`);
    })
  })
}

module.exports = { connectRealTime }
