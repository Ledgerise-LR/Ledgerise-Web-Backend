
const getEventData = require("../utils/getEventData");
const saveRealItemHistory = require("../listeners/saveRealItemHistory");
const async = require("async");

module.exports = () => {
  const eventDataArray = getEventData((err, eventData) => {
    if (err) return "bad_request";
    if (eventData.length) {
      async.timesSeries(eventDataArray.length, async (i, next) => {
        const eventData = eventDataArray[i];

        const txHash = await saveRealItemHistory(eventData);
        return next()
      });
    }
  }, (err) => {
    if (err) return "bad_request";
    if (!err) return "done";
  });
}
