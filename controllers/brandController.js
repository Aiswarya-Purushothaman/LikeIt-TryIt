const Brand = require("../models/brandSchema")
const Product = require("../models/productSchema")

const getBrandPage = async (req, res)=>{
    try {
        const brandData = await Brand.find({})
        console.log(brandData);
        res.render("brands", {data : brandData})
    } catch (error) {
         res.redirect("/pageerror");;
    }
}

const addBrand = async (req, res)=>{
    try {
        const brand = req.body.name
        console.log(brand);
        const findBrand = await Brand.findOne({brand})
        if(!findBrand){
            const image = req.file.filename
            const newBrand = new Brand({
                brandName : brand,
                brandImage : image
            })

            await newBrand.save()
            res.redirect("/admin/brands")
        }
    } catch (error) {
         res.redirect("/pageerror");;
    }
}


const getAllBrands = async (req, res)=>{
    try {
        const brandData = await Brand.find({})
        console.log(brandData);
        res.render("brands", {data : brandData})
    } catch (error) {
         res.redirect("/pageerror");;
    }
}


const blockBrand = async (req, res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id : id}, {$set : {isBlocked : true}})
        console.log("brand blocked");
        res.redirect("/admin/brands")
    } catch (error) {
         res.redirect("/pageerror");;
    }
}



const unBlockBrand = async (req, res)=>{
    try {
        const id = req.query.id
        await Brand.updateOne({_id : id}, {$set : {isBlocked : false}})
        console.log("brand unblocked");
        res.redirect("/admin/brands")
    } catch (error) {
         res.redirect("/pageerror");;
    }
}

const deletebrand=async(req,res)=>{
  try {

    const id =req.query.id
   var pink= await Brand.deleteOne({_id : id})
   
    res.redirect("/admin/brands")
    
  } catch (error) {
     res.redirect("/pageerror");
  }
}


module.exports = {
    getBrandPage,
    addBrand,
    getAllBrands,
    blockBrand,
    unBlockBrand,
    deletebrand
}