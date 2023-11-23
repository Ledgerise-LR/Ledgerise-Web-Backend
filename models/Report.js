
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: {
    type: String,
    required: true,
    lowercase: true
  },
  message: {
    type: String,
    required: true
  },

  reportCodes: [
    reportCode = {
      type: Number,
      unique: true,
      required: true
    }
  ],

  timestamp: {
    type: Number,
    required: true
  }
});

reportSchema.statics.createNewReport = function (body, callback) {
  const newReport = new newReport(body);
  if (newReport) {
    newReport.save();
    return callback(null, newReport);
  }
  return callback("bad_request");
}

const report = mongoose.model("Report", reportSchema);

module.exports = report
