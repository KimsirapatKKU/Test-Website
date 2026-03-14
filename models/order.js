const mongoose = require("mongoose")

const dbURL = 'mongodb://localhost:27017/foodOrderingDB'

mongoose.connect(dbURL)
.then(()=>console.log("MongoDB connected"))
.catch(err=>console.log(err))

const orderSchema = new mongoose.Schema({
  table: Number,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      note: String
    }
  ],
  status: {
    type: String,
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model("Order", orderSchema)
module.exports = Order