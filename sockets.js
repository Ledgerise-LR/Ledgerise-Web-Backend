
const socketIo = require("socket.io");
const { spawn } = require("child_process");
const VisualVerification = require("./models/VisualVerification");

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
      console.log(processedImage);
    })
  });
}

let tempBase64Image = "";

let key = "";
let location = {};
let date = ""

const connectRealTime = (server) => {
  const io = socketIo(server);
  const realtimeNamespace = io.of('/realtime');


  realtimeNamespace.on("connection", (socket) => {
    console.log(`Client connected to ${PATH_NAME}`);


    socket.on("cameraFrame", async (base64ImageData) => {
      if (base64ImageData != "done" && !base64ImageData.socketCallKey) {

        if (location || date || key) {
          location = "";
          date = "";
          key = "";
        }

        tempBase64Image += base64ImageData;

      } else if (base64ImageData == "done") {

        const processedImageData = await processImage(tempBase64Image);

        if (processedImageData != undefined) {
          const formattedProcessedImageData = processedImageData.replace(/'/g, '"')
          await socket.emit('processedImage', JSON.parse(formattedProcessedImageData));

          const parsedProcessedImageData = JSON.parse(formattedProcessedImageData);

          if (parsedProcessedImageData.found_status == "true" && parsedProcessedImageData.user_info != "") {

            const userInfo = parsedProcessedImageData.user_info.split("-");

            const eventData = {
              nftAddress: userInfo[0],
              tokenId: userInfo[1],
              openseaTokenId: userInfo[2],
              buyer: userInfo[3],
              key: key,
              location: location,
              date: date,
              isUploadedToBlockchain: false
            }

            const newEventData = new VisualVerification(eventData);
            await newEventData.save()
            socket.emit("upload", "complete");

          }
          tempBase64Image = "";
        }
      } else if (base64ImageData.socketCallKey && base64ImageData.socketCallKey == "locationAndDate") {

        location = base64ImageData.location;
        date = base64ImageData.date;
      }
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected from ${PATH_NAME}`);
    })
  })
}

module.exports = { connectRealTime }
