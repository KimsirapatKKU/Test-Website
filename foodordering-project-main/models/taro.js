const mongoose = require("mongoose");

const dbURL = 'mongodb://localhost:27017/foodOrderingDB'

mongoose.connect(dbURL)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err))


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