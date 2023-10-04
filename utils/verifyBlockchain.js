
const getEventData = require("../utils/getEventData");
const ActiveItem = require("../models/ActiveItem");
const async = require("async");

module.exports = () => {
  getEventData((err, eventDataArray) => {
    if (err) return console.error(err);
    if (eventDataArray.length) {
      async.timesSeries(eventDataArray.length, async (i, next) => {
        const eventData = eventDataArray[i];

        ActiveItem.saveRealItemHistory(eventData, (err, activeItem) => {
          if (err) return console.error(err);
          return next()
        })
      });
    }
  }, (err) => {
    if (err) return "bad_request";
    if (!err) return "done";
  });
}
