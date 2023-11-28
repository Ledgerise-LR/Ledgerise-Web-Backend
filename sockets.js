
const socketIo = require("socket.io");
const { spawn } = require("child_process");
const VisualVerification = require("./models/VisualVerification");
const async = require("async");

const PATH_NAME = "/realtime";
const PREDICT_DIR = "../LedgeriseLens-AI/detect.py";
// const TEMP_IMAGE_DIR = "../Nft-Fundraising-nodejs-backend/temp_image.png"

const printImageChunks = async (imageBase64, pythonProcess) => {
  if (imageBase64.length <= 0) return setIsProcessing(false);
  const chunkSize = 64;
  for (let offset = 0; offset < imageBase64.length; offset += chunkSize) {
    const chunk = await imageBase64.substring(offset, offset + chunkSize);
    pythonProcess.stdin.write(chunk);
  }

  pythonProcess.stdin.end();
}

const processImage = (imageBase64) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python3", [PREDICT_DIR]);

    printImageChunks(imageBase64, pythonProcess);

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
          tempBase64Image = "";
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

            user_info = JSON.parse(user_info); // delete later for LR COLLAB
            async.timesSeries(user_info.length, (i, next) => {

              const userInfo = user_info[i].split("-");

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

              VisualVerification.createVisualVerification(eventData, async (err, visualVerification) => {

                if (err == "error") await socket.emit("upload", `error-${i}`);

                if (err == "already_verified") await socket.emit("upload", `already_verified-${i}`);

                if (err == "incompatible_data") await socket.emit("upload", `incompatible_data-${i}`);

                if (!err && visualVerification) await socket.emit("upload", `complete-${i}`);

                return next();
              })
            })
          }
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
