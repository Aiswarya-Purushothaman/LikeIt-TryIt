const Category = require("../models/categorySchema");
const Product=require("../models/productSchema")

// Rendering the category page
const getCategoryInfo = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("category", { cat: categoryData });
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const addCategory = async (req, res) => {
  console.log(req.body);
  const { name, description } = req.body
  // try {
  //     const { name, description } = req.body
  //     const categoryExists = await Category.findOne({ name })
  //     if (description) {
  //         if (!categoryExists) {
  //             const newCategory = new Category({
  //                 name: name,
  //                 description: description
  //             })
  //             await newCategory.save()
  //             console.log("New Category : ", newCategory);
  //             res.redirect("/admin/allCategory")
  //         } else {
  //             res.redirect("/admin/category")
  //             console.log("Category Already exists");
  //         }
  //     } else {
  //         console.log("description required");
  //     }
  // } catch (error) {
  //      res.redirect("/pageNotFound");
  // }

  const newCategory = new Category({
    name: name,
    description: description,
  });
 const reslt = await newCategory.save();
res.redirect("/admin/allCategory")

 console.log(reslt,"rslt");

};


const getAllCategories = async (req, res) => {
  try {
    const categoryData = await Category.find({});
    res.render("category", { cat: categoryData });
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const getListCategory = async (req, res) => {
  try {
    let id = req.query.id;
    console.log("wrking");
    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    res.redirect("/admin/category");
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const getUnlistCategory = async (req, res) => {
  try {
    let id = req.query.id;
    await Category.updateOne({ _id: id }, { $set: { isListed: true } });
    res.redirect("/admin/category");
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const getEditCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findOne({ _id: id });
    res.render("edit-category", { category: category });
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const editCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const { categoryName, description } = req.body;
    const findCategory = await Category.find({ _id: id });
    if (findCategory) {
      await Category.updateOne(
        { _id: id },
        {
          name: categoryName,
          description: description,
        }
      );
      res.redirect("/admin/category");
    } else {
      console.log("Category not found");
    }
  } catch (error) {
     res.redirect("/pageerror");
  }
};

const addCategoryOffer = async (req, res) => {
  console.log(req.body,"<><><>");
  try {
      const percentage = parseInt(req.body.percentage);
      const categoryId = req.body.categoryId;

      const findCategory = await Category.findOne({ _id: categoryId });
      const productData = await Product.find({ category: findCategory._id });

      // Check if any product within the category has a non-zero productOffer
      const hasProductOffer = productData.some(product => product.productOffer > percentage);

      if (hasProductOffer) {
          console.log("Products within this category already have product offers. Category offer not added.");
          return res.json({ status: false, message: "Products within this category already have product offers." });
      }

      // Update categoryOffer only if no product within the category has a productOffer
      await Category.updateOne(
          { _id: categoryId },
          { $set: { categoryOffer: percentage } }
      );

      // Update productOffer to zero for all products within the category
      for (const product of productData) {
          product.productOffer = 0;
          product.salePrice = product.regularPrice; // Reset salePrice
          await product.save();
      }

      console.log("Category offer added successfully.");
      res.json({ status: true });

  } catch (error) {
       res.redirect("/pageerror");
      // res.status(500).json({ status: false, message: "Internal Server Error" });
  }
}


const removerCategoryOffer = async (req, res)=>{
  try {
      console.log(req.body,"canceling");
      const categoryId = req.body.categoryId
      const findCategory = await Category.findOne({_id : categoryId})
      console.log(findCategory);

      const percentage = findCategory.categoryOffer
      // console.log(percentage);
      const productData = await Product.find({category : findCategory._id})

      if(productData.length > 0){
          for(const product of productData){
              product.salePrice = product.salePrice +  Math.floor(product.regularPrice * (percentage / 100))
              await product.save()
          }
      }

      findCategory.categoryOffer = 0
      await findCategory.save()

      res.json({status : true})

  } catch (error) {
       res.redirect("/pageerror");
  }
}


module.exports = {
  getCategoryInfo,
  addCategory,
  getAllCategories,
  getListCategory,
  getUnlistCategory,
  editCategory,
  getEditCategory,
  addCategoryOffer,
  removerCategoryOffer
};
