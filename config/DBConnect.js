const mongoose = require("mongoose");
const url = process.env.MONGO_URL;

const DBconnect = () => {
  mongoose
    .connect(url)
    .then(() => console.log("MongoDB Server Started"))
    .catch((e) => {
      console.log(e);
    });
};

module.exports = DBconnect;