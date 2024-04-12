
const TokenUri = require("../../../models/tokenUri");

module.exports = (req, res) => {
  TokenUri.find({}, (err, tokenUris) => {
    if (err) return res.status(200).json({ success: false, data: "bad_request" });
    return res.status(200).json({ success: true, data: tokenUris });
  })
}