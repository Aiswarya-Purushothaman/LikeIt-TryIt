const mongoose=require("mongoose");
const category = require('../models/categorySchema')
const connectDB=mongoose.connect("mongodb://127.0.0.1:27017/Lapitout")
connectDB.then(()=>{
  category.createIndexes();
})
.catch((err)=>{
  console.log(err.message);
})