const ethers = require("ethers");
const express = require("express");
const http = require("http");
const abi = require("./constants/abi.json");
const ActiveItem = require("./models/ActiveItem");
const mongoose = require("mongoose");
require("dotenv").config()
const app = express();

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const { handleItemBought, handleItemListed, handleItemCanceled } = require("./listeners/exportListeners");

const mongoUri = "mongodb://127.0.0.1:27017/nft-fundraising-api";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your Next.js domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

server.listen(PORT, async () => {

  handleItemBought();
  handleItemCanceled();
  handleItemListed();
  console.log("Server is listening on port", PORT);
})


