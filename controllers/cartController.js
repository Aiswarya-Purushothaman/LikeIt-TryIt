const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const mongodb = require("mongodb");

const getCartPage = async (req, res) => {
  try {
    const id = req.session.user;
    console.log(id);
    console.log("cart is workding");
    const user = await User.findOne({ _id: id });
    console.log(user, "user");
    const productIds = user.cart.map((item) => item.productId);
    console.log(productIds, "yes");
    const products = await Product.find({ _id: { $in: productIds } });
    // console.log(user.cart[0].quantity);

    const oid = new mongodb.ObjectId(id);
    console.log(oid, "oid");
    let data = await User.aggregate([
      { $match: { _id: oid } },
      { $unwind: "$cart" },
      {
        $project: {
          proId: { $toObjectId: "$cart.productId" },
          quantity: "$cart.quantity",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "proId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    console.log("Data  =>>", data);

    let quantity = 0;

    for (const i of user.cart) {
      quantity += i.quantity;
    }
    // console.log(user.cart.length,'this is cart lenght')
    // console.log(products)
    let grandTotal = 0;
    for (let i = 0; i < data.length; i++) {
      console.log("sale prices ==>", data[i].productDetails[0].salePrice);
      console.log("Quantity ==>", data[i].quantity);
      if (products[i]) {
        grandTotal += data[i].productDetails[0].salePrice * data[i].quantity;
      }
      console.log(grandTotal, "hsihishi ");
      req.session.grandTotal = grandTotal;
    }
    // console.log(grandTotal)

    console.log(grandTotal);

    res.render("cart", {
      user,
      quantity,
      data,
      grandTotal,
    });
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const addToCart = async (req, res) => {
  console.log("pinkybag");
  try {
    const id = req.body.productId;

    console.log(id, "product id");
    const userId = req.session.user;
    const findUser = await User.findById(userId);
    // console.log(findUser);
    const product = await Product.findById({ _id: id }).lean();
    console.log(product, "product");
    if (!product) {
      return res.json({ status: "Product not found" });
    }
    
        if (product.quantity > 0) {
            const cartIndex = findUser.cart.findIndex((item) => item.productId == id);
            console.log(cartIndex, "cartIndex");
            if (cartIndex == -1) {
              // console.log("this");
              let quantity = 1;
              await User.findByIdAndUpdate(userId, {
                $addToSet: {
                  cart: {
                    productId: id,
                    quantity: quantity,
                  },
                },
              }).then((data) =>
                res.json({ status: true, cartLength: findUser.cart.length,user:userId })
              );
            } else {
              // console.log("hi");
              const productInCart = findUser.cart[cartIndex];
              console.log(productInCart, "product");
              if (productInCart.quantity <= product.quantity) {
                const newQuantity = parseInt(productInCart.quantity) + 1;
                await User.updateOne(
                  { _id: userId, "cart.productId": id },
                  { $set: { "cart.$.quantity": newQuantity } }
                );
                res.json({ status: true, cartLength: findUser.cart.length,user:userId });
              } else {
                // console.log("Poruno");
                res.json({ status: "Out okk of stock" });
              }
              // console.log(productInCart, "product", newQuantity);
            }
          } else {
            res.json({ status: "Out of stock" });
          }

    
   
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const changeQuantity = async (req, res) => {
  try {
    // console.log('here--');
    const id = req.body.productId;
    const user = req.session.user;
    console.log(user, "user id1");
    const count = req.body.count;
    // count(-1,+1)

    // console.log(user);
    // console.log(id, "productId");

    const findUser = await User.findOne({ _id: user });
    console.log(findUser);
    const findProduct = await Product.findOne({ _id: id });
    const oid = new mongodb.ObjectId(user);

    if (findUser) {
      // console.log('iam here--');
      const productExistinCart = findUser.cart.find(
        (item) => item.productId === id
      );
      // console.log(productExistinCart, 'this is product in cart');
      let newQuantity;
      if (productExistinCart) {
        // console.log('iam in the carrt----------------------mm');
        console.log(count);
        if (count == 1) {
          // console.log("count + 1");
          newQuantity = productExistinCart.quantity + 1;
        } else if (count == -1) {
          // console.log("count - 1");
          newQuantity = productExistinCart.quantity - 1;
        } else {
          // console.log("errrrrrrrr");
          return res
            .status(400)
            .json({ status: false, error: "Invalid count" });
        }
      } else {
        // console.log('hhihihihihihi../');
      }
      // console.log('hiiiiiiiiii',newQuantity);
      console.log(newQuantity, "this id new Quantity");
      if (newQuantity > 0 && newQuantity <= findProduct.quantity) {
        let quantityUpdated = await User.updateOne(
          { _id: user, "cart.productId": id },
          {
            $set: {
              "cart.$.quantity": newQuantity,
            },
          }
        );
        const totalAmount = findProduct.salePrice * newQuantity;
        const grandTotal = await User.aggregate([
          { $match: { _id: oid } },
          { $unwind: "$cart" },
          {
            $project: {
              proId: { $toObjectId: "$cart.productId" },
              quantity: "$cart.quantity",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "proId",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          {
            $unwind: "$productDetails", // Unwind the array created by the $lookup stage
          },

          {
            $group: {
              _id: null,
              totalQuantity: { $sum: "$quantity" }, // Sum of quantities from the Cart collection
              totalPrice: {
                $sum: { $multiply: ["$quantity", "$productDetails.salePrice"] },
              }, // Sum of (quantity * price) from the joined collections
            },
          },
        ]);
        console.log(grandTotal, "grand total");
        if (quantityUpdated) {
          // console.log('iam here inside the cart', quantityUpdated, 'ok');

          res.json({
            status: true,
            quantityInput: newQuantity,
            count: count,
            totalAmount: totalAmount,
            grandTotal: grandTotal[0].totalPrice,
          });
        } else {
          res.json({ status: false, error: "cart quantity is less" });
        }
      } else {
        res.json({ status: false, error: "out of stock" });
      }
    }
  } catch (error) {
    res.redirect("/pageNotFound");
    return res.status(500).json({ status: false, error: "Server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, "id");
    const userId = req.session.user;
    const user = await User.findById(userId);
    const cartIndex = user.cart.findIndex((item) => item.productId == id);
    user.cart.splice(cartIndex, 1);
    await user.save();
    console.log("item deleted from cart");
    res.redirect("/cart");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

module.exports = {
  getCartPage,
  addToCart,
  changeQuantity,
  deleteProduct,
};
