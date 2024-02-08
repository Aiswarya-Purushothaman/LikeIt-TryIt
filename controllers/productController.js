const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const Brand = require("../models/brandschema");
const fs = require("fs");
const path = require("path");
const User = require("../models/userSchema");
const sharp = require("sharp");


const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    res.render("product-add", { cat: category, brand: brand });
  } catch (error) {
    console.log(error.message);
  }
};

const addProducts = async (req, res) => {
  try {
    console.log("working");

    const products = req.body;
    console.log(products);
    const productExists = await Product.findOne({
      productName: products.productName,
    });
    console.log(productExists, "product");
    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const originalImageMetadata = await sharp(
            originalImagePath
          ).metadata();
          console.log(
            `Original Image Size: ${originalImageMetadata.width}x${originalImageMetadata.height} pixels`
          );
          const resizedImagePath = path.join(
            "public",
            "uploads",
            "product-images",
            req.files[i].filename
          );
          await sharp(originalImagePath)
            .resize({ width: 440, height: 440 })
            .toFile(resizedImagePath);

          console.log(resizedImagePath, "resized image path");
          images.push(req.files[i].filename);
        }
      }

      const newProduct = new Product({
        id: Date.now(),
        productName: products.productName,
        description: products.description,
        brand: products.brand,
        category: products.category,
        regularPrice: products.regularPrice,
        salePrice: products.salePrice,
        createdOn: new Date(),
        quantity: products.quantity,
        size: products.size,
        color: products.color,
        productImage: images,
        status:false
      });
      await newProduct.save();
      res.redirect("/admin/addProducts");
      // res.json("success")
    } else {
      res.json("failed");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getEditProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const findProduct = await Product.findOne({ _id: id });

    const category = await Category.find({});
    const findBrand = await Brand.find({});
    res.render("edit-product", {
      product: findProduct,
      cat: category,
      brand: findBrand,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteSingleImage = async (req, res) => {
  try {
    const { imageNameTOserver, productIdToServer } = req.body;
    const product = await Product.findByIdAndUpdate(productIdToServer, {
      $pull: { productImage: imageNameTOserver },
    });
    console.log(imageNameTOserver);
    const imagePath = path.join(
      "public",
      "uploads",
      "product-images",
      imageNameTOserver
    );
    if (fs.existsSync(imagePath)) {
      await fs.unlinkSync(imagePath);
      console.log(`Image ${imageNameTOserver} deleted successfully`);
    } else {
      console.log(`Image ${imageNameTOserver} not found`);
    }

    res.send({ status: true });
  } catch (error) {
    console.log(error.message);
  }
};

const editProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        images.push(req.files[i].filename);
      }
    }
    console.log(req.files);
    if (req.files.length > 0) {
      console.log("Yes image is there");
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          id: Date.now(),
          productName: data.productName,
          description: data.description,
          brand: data.brand,
          category: data.category,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
          quantity: data.quantity,
          size: data.size,
          color: data.color,
          processor: data.processor,
          createdOn: new Date(),
          productImage: images,
          status:false
        },
        { new: true }
      );
      console.log("product updated");
      res.redirect("/admin/products");
    } else {
      console.log("No images i thter");
      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          id: Date.now(),
          productName: data.productName,
          description: data.description,
          brand: data.brand,
          category: data.category,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
          quantity: data.quantity,
          size: data.size,
          color: data.color,
          processor: data.processor,
          createdOn: new Date(),
          status:false
        },
        { new: true }
      );
      console.log("product updated");
      res.redirect("/admin/products");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 4;
    const productData = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.find({
      $or: [
        { productName: { $regex: new RegExp(".*" + search + ".*", "i") } },
        { brand: { $regex: new RegExp(".*" + search + ".*", "i") } },
      ],
    }).countDocuments();

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });
    // console.log(category,"category");
    // console.log(brand,"brand");

    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
      });
    } else {
      res.render("page-404");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getBlockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: true } });
    console.log("product blocked");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const getUnblockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    console.log("product unblocked");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message);
  }
};

const productDetails = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    const id = req.query.id;
    const product = await Product.findOne({ id: id });
    const findCategory = await Category.findOne({name : product.category})
    let totalOffer
    if(findCategory.categoryOffer || product.productOffer){
        totalOffer = findCategory.categoryOffer + product.productOffer
    }

    const categories = await Category.find({});
    console.log(categories, "fullcategories");
    console.log(product, "product");
    let quantity = product.quantity;
    console.log(quantity, "quantity");

    res.render("productdetail", {
      user: userData,
      product: product,
      quantity: quantity,
      categories: categories,
      totalOffer:totalOffer
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addProductOffer = async (req, res) => {
  try {
      console.log(req.body, "req body of add");
      const { productId, percentage } = req.body;
      
      const findProduct = await Product.findOne({ _id: productId });
      const findCategory = await Category.findOne({ name: findProduct.category });

      // Check if categoryOffer is already set for the category
      if (findCategory.categoryOffer !== 0) {
          console.log("This product's category already has a category offer. Product offer not added.");
          return res.json({ status: false, message: "This product's category already has a category offer." });
      }

      // If categoryOffer is not set for the category, apply product offer to the product
      findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (percentage / 100));
      findProduct.productOffer = parseInt(percentage);
      await findProduct.save();

      res.json({ status: true });

  } catch (error) {
      console.log(error.message);
      res.status(500).json({ status: false, message: "Internal Server Error" });
  }
}



const removeProductOffer = async (req, res) => {
  try {
      // console.log(req.body);
      const {productId} = req.body
      const findProduct = await Product.findOne({_id : productId})
      // console.log(findProduct);
      const percentage = findProduct.productOffer
      findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice * (percentage / 100))
      findProduct.productOffer = 0
      await findProduct.save()
      res.json({status : true})
  } catch (error) {
      console.log(error.message);
     
  }
}



module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  getBlockProduct,
  getUnblockProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage,
  productDetails,
  addProductOffer,
  removeProductOffer
};