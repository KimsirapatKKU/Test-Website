const mongoose = require("mongoose");



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
