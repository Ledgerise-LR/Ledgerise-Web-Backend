
const TokenUri = require("../../../models/tokenUri");

module.exports = (req, res) => {

  TokenUri.createTokenUri(req, (err, tokenUri) => {
    if (err) return res.status(200).json({ success: false, data: "bad_request" });
    return res.status(200).json({ success: true, tokenUri: tokenUri });
  })
}
