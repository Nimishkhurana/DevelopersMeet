const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
    console.log("MongoDB Connected...");
  } catch (err) {
    console.error("MongoDB Error...", err.message);
    // Exit process with failure
    process.exit(1);
  }
};
//   "mongoURI": "mongodb+srv://nkhurana:nimish3122@devconnector-khkz4.mongodb.net/test"
// "mongoURI": "mongodb://127.0.0.1:27017/test?retrywrites=true",

module.exports = connectDB;
