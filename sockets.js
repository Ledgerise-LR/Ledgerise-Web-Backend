
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
      console.log(processedImage)
    })
  });
}

let tempBase64Image = "";

let key = "";
let location = {};
let date = ""
let user_info = "";

var socketConnection = "";

const connectRealTime = (server) => {
  const io = socketIo(server);
  const realtimeNamespace = io.of('/realtime');

  if (socketConnection != "") return;

  realtimeNamespace.on("connection", (socket) => {

    if (socketConnection != "") return;
    socketConnection = socket.id;

    console.log(`Client connected to ${PATH_NAME}, socket ${socket.id}`);

    socket.on("cameraFrame", async (base64ImageData) => {
      if (base64ImageData != "done" && base64ImageData.socketCallKey != "locationAndDate") {

        if (location || date || key) {
          location = "";
          date = "";
          key = "";
          user_info = "";
        }
        tempBase64Image += base64ImageData;

      } else if (base64ImageData == "done") {
        // console.log(tempBase64Image);
        const processedImageData = await processImage(tempBase64Image);
        if (processedImageData != undefined) {
          const formattedProcessedImageData = processedImageData.replace(/'/g, '"')

          await socket.emit('processedImage', JSON.parse(formattedProcessedImageData));

          const parsedProcessedImageData = JSON.parse(formattedProcessedImageData);

          if (parsedProcessedImageData.found_status == "true") {

            const userInfo = user_info.split("-");

            const eventData = {
              nftAddress: userInfo[0],
              tokenId: userInfo[1],
              openseaTokenId: userInfo[2],
              base64_image: tempBase64Image,
              buyer: userInfo[3],
              key: key,
              location: location,
              date: date,
              isUploadedToBlockchain: false
            }

            VisualVerification.createVisualVerification(eventData, (err, visualVerification) => {

              if (err == "error") return socket.emit("upload", "error");

              if (err == "already_verified") return socket.emit("upload", "already_verified");

              if (err == "incompatible_data") return socket.emit("upload", "incompatible_data");

              if (!err && visualVerification) return socket.emit("upload", "complete");

            })
          }
          tempBase64Image = "";
        }
      } else if (base64ImageData.socketCallKey && base64ImageData.socketCallKey == "locationAndDate") {

        location = base64ImageData.location;
        date = base64ImageData.date;
        key = base64ImageData.key;
        user_info = base64ImageData.user_info;
      }
    })

    socket.on("disconnect", () => {
      socket.disconnect();
      socketConnection = "";
      console.log(`Client disconnected from ${PATH_NAME}, socket ${socket.id}`);
    })
  })
}

module.exports = { connectRealTime }
