
const WhatsappVerifier = require("../../../models/WhatsappVerifier");

module.exports = (req, res) => {

  WhatsappVerifier.find(req.query || {}, (err, whatsappVerifiers) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, whatsappVerifiers: whatsappVerifiers });
  })
}
