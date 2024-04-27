
const WhatsappVerifier = require("../../../models/WhatsappVerifier");

module.exports = (req, res) => {

  WhatsappVerifier.createWhatsappVerifier(req.body, (err, whatsappVerifier) => {
    if (err) return res.json({ success: false, err: err });
    return res.json({ success: true, whatsappVerifier: whatsappVerifier });
  })
}
