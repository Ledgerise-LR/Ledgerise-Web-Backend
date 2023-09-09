
const socketIo = require("socket.io");
const { spawn } = require("child_process");


const PATH_NAME = "/realtime";
const PREDICT_DIR = "../LedgeriseLens-AI/main.py";

const processImage = (imageBase64) => {

  // Will connect to python script that will be processing the image
  // and returning a base64 output to display real-time

  const pythonProcess = spawn("python", [PREDICT_DIR], {
    input: imageBase64,
    encoding: "utf-8"
  })

  pythonProcess.stdout.on("data", (data) => {
    const processedImage = data.toString();
    return processedImage;
  })

  return imageBase64;
}

const connectRealTime = (server) => {
  const io = socketIo(server, {
    path: PATH_NAME
  });


  io.on("connection", (socket) => {
    console.log(`Client connected to ${PATH_NAME}`);


    socket.on("cameraFrame", (base64ImageData) => {
      const processedImageData = processImage(base64ImageData);

      socket.emit("processedImage", processedImageData);
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected from ${PATH_NAME}`);
    })
  })
}

module.exports = { connectRealTime }
