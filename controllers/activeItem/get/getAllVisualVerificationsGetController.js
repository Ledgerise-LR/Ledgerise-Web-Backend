
const VisualVerification = require("../../../models/VisualVerification");

module.exports = (req, res) => {
  VisualVerification.find({}, (err, visualVerifications) => {
    if (err) return res.status(400).send(err);
    if (visualVerifications.length) return res.status(200).json({ data: visualVerifications });
  })
}