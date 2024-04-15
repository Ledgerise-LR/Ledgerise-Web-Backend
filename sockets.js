
const socketIo = require("socket.io");
const VisualVerification = require("./models/VisualVerification");
const async = require("async");
const ActiveItem = require("./models/ActiveItem");
const { SERVER_URL, PORT } = require("./utils/serverUrl");
const axios = require("axios");

const PATH_NAME = "/realtime";

const processImage = (imageBase64, bounds) => {
  return new Promise((resolve, reject) => {
    // send request to python server
    const url = `${SERVER_URL}:${PORT}/real-time`;
    axios.post(url, {
      image: imageBase64,
      bounds: bounds
    })
      .then(res => {
        const data = res.data.trim();
        resolve(data);
      })
  });
}

let tempBase64Image = "";

let key = "";
let location = {};
let date = ""
let user_info = "";
let bounds = {};
let subcollectionId = "";
let nftAddress = "";

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

        // console.log(base64ImageData.length);

        if (location || date || key) {
          location = "";
          date = "";
          key = "";
          user_info = "";
          tempBase64Image = "";
          bounds = "";
          subcollectionId = "";
          nftAddress = "";
        }
        tempBase64Image += base64ImageData;

      } else if (base64ImageData == "done") {

        // // debugging
        // console.log(`Length of image: ${tempBase64Image.length}`);
        // console.log(`Location: ${location.latitude}, ${location.longitude}`);
        // console.log(`user_info: ${user_info}`);
        // console.log(`date: ${date}`);
        // console.log(`key: ${key}`);
        const processedImageData = await processImage(tempBase64Image, bounds);
        if (processedImageData != undefined) {

          await socket.emit('processedImage', JSON.parse(processedImageData));

          const parsedProcessedImageData = JSON.parse(processedImageData);

          if (parsedProcessedImageData.found_status == "true") {

            const tokenId = user_info.split("-")[0];
            let donorsArray = user_info.split("-")[1];

            donorsArray = JSON.parse(donorsArray);

            async.timesSeries(donorsArray.length, async (i, next) => {

              const openseaTokenId = parseInt(donorsArray[i]);

              const item = await ActiveItem.findOne({ tokenId: tokenId, subcollectionId: subcollectionId, nftAddress: nftAddress }).select({ history: { $elemMatch: { openseaTokenId: openseaTokenId } } });

              const buyer = item.history[0].buyer;

              const eventData = {
                nftAddress: nftAddress,
                tokenId: tokenId,
                openseaTokenId: openseaTokenId,
                base64_image: tempBase64Image,
                buyer: buyer,
                key: key,
                location: location,
                date: date,
                isUploadedToBlockchain: false,
                bounds: bounds,
              }

              VisualVerification.createVisualVerification(eventData, async (err, visualVerification) => {

                if (err == "error") await socket.emit("upload", `error-${i}-${donorsArray.length}`);

                if (err == "already_verified") await socket.emit("upload", `already_verified-${i}-${donorsArray.length}`);

                if (err == "incompatible_data") await socket.emit("upload", `incompatible_data-${i}-${donorsArray.length}`);

                if (!err && visualVerification) {
                  await socket.emit("upload", `complete-${i}-${donorsArray.length}`)
                };
              })
            })
          }
        }
      } else if (base64ImageData.socketCallKey && base64ImageData.socketCallKey == "locationAndDate") {

        // console.log(base64ImageData);

        location = base64ImageData.location;
        date = base64ImageData.date;
        key = base64ImageData.key;
        user_info = base64ImageData.user_info;
        bounds = base64ImageData.barcode_bounds;
        subcollectionId = base64ImageData.subcollectionId;
        nftAddress = base64ImageData.nftAddress;
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
