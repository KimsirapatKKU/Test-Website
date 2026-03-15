const mongoose = require("mongoose");



let taroSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    image: String
  }
)

//model
const Taro = mongoose.model("toros",taroSchema)

//export model
module.exports = Taro