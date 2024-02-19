const mongoose=require("mongoose");
const category = require('../models/categorySchema')
const dotenv = require('dotenv')
dotenv.config()
const connectDB=mongoose.connect(process.env.MONGO_URL)
connectDB.then(()=>{
  console.log("db connected");
  category.createIndexes();
})
.catch((err)=>{
  console.log(err.message);
})