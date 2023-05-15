
const { default: axios } = require("axios");
const ActiveItem = require("../models/ActiveItem");
const async = require("async");

module.exports = () => {
  ActiveItem.find({}, (err, activeItems) => {
    if (err) return console.log("bad_request");
    async.timesSeries(activeItems.length, (i, next) => {
      const activeItem = activeItems[i];
      const tokenUri = activeItem.tokenUri;
      const url = `https://ipfs.io/ipfs/${tokenUri.replace("ipfs://", "")}`;
      axios.get(url)
        .then(response => {
          const data = response.data;
          const attributes = data.attributes;
          activeItem.attributes = attributes;
          activeItem.save();
        })
        .catch(error => {
          console.error('Error:', error);
        });
      next();
    })
  })
}
