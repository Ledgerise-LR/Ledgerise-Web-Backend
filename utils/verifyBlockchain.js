
const getEventData = require("../utils/getEventData");
const ActiveItem = require("../models/ActiveItem");
const async = require("async");

module.exports = () => {
  getEventData((err, eventDataArray) => {

    if (err) return console.error(err);
    if (eventDataArray.length) {
      async.timesSeries(eventDataArray.length, (i, next) => {
        const eventData = eventDataArray[i];

        ActiveItem.saveRealItemHistory(eventData, (err, activeItem) => {
          if (err) console.error(err);
          next();
        })
      }, (err) => {
        if (err) return console.log("bad_request");
        if (!err) return console.log("done");
      });
    }
  });
}
