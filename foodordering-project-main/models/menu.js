
const mongoose = require("mongoose");

const dbURL = 'mongodb://localhost:27017/foodOrderingDB'

mongoose.connect(dbURL)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err))

let menuSchema = new mongoose.Schema(
  {
    id: Number,
    name: String,
    price: Number,
    category: String,
    image: String
  }
)


//model
const Menus = mongoose.model("menus",menuSchema)

//export model
module.exports = Menus
