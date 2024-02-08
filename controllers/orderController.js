const User = require("../models/userSchema");
const Product = require("../models/productSchema");
const Address = require("../models/addressSchema");
const Order = require("../models/orderSchema");
const mongodb = require("mongodb");
const mongoose = require('mongoose')
const razorpay = require("razorpay");
const env = require("dotenv");
const crypto = require("crypto");
const Coupon=require("../models/couponSchema")
env.config();

let instance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// console.log(instance);

const getCheckoutPage = async (req, res) => {
  try {
    console.log("queryyyyyyyy", req.query);

    const user = req.query.userId;
    const findUser = await User.findOne({ _id: user });
    // console.log(findUser);
    // const productIds = findUser.cart.map(item => item.productId)
    // console.log(productIds)
    // const findProducts = await Product.find({ _id: { $in: productIds } })
    // console.log(findProducts);
    const addressData = await Address.findOne({ userId: user });
    // console.log("THis is find product =>",findProducts);
    const oid = new mongodb.ObjectId(user);
    const data = await User.aggregate([
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

    console.log("Data  =>>", data);
    // console.log("Data  =>>" , data[0].productDetails[0])
    const gTotal = req.session.grandTotal;
    console.log(grandTotal, "grand tog");
    // console.log(grandTotal);
    const today = new Date().toISOString(); // Get today's date in ISO format
    // console.log(data[1].productDetails[0].productImage[0],"daATA");
    const findCoupons = await Coupon.find({
      isList: true,
      createdOn: { $lt: new Date(today) },
      expireOn: { $gt: new Date(today) },
      minimumPrice: { $lt: grandTotal[0].totalPrice},
  });

  console.log(findCoupons, 'this is coupon ');

    if (findUser.cart.length > 0) {
      res.render("checkoutcart", {
        product: data,
        user: findUser,
        isCart: true,
        userAddress: addressData,
        grandTotal: grandTotal[0].totalPrice,
        Coupon:findCoupons
      });
    } else {
      res.redirect("/shop");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const orderPlaced = async (req, res) => {
  try {
    console.log("req.body===>", req.body);
    console.log("from cart");

    const { totalPrice, addressId, payment } = req.body;
    // console.log(totalPrice, addressId, payment);
    const userId = req.session.user;
    const findUser = await User.findOne({ _id: userId });
    const productIds = findUser.cart.map((item) => item.productId);

    //  const addres= await Address.find({userId:userId})

    const findAddress = await Address.findOne({ "address._id": addressId });

    if (findAddress) {
      const desiredAddress = findAddress.address.find(
        (item) => item._id.toString() === addressId.toString()
      );
      // console.log(desiredAddress);

      const findProducts = await Product.find({ _id: { $in: productIds } });

      const cartItemQuantities = findUser.cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        
      }));

      const orderedProducts = findProducts.map((item) => ({
        _id: item._id,
        price: item.salePrice,
        name: item.productName,
        image: item.productImage[0],
        productStatus:"Confirmed",
        quantity: cartItemQuantities.find(
          (cartItem) => cartItem.productId.toString() === item._id.toString()
        ).quantity,
      }));

 console.log(orderedProducts,"orderedProducts");
 let newOrder
 if(payment=="razorpay"){
   newOrder = new Order({
    product: orderedProducts,
    totalPrice: totalPrice,
    address: desiredAddress,
    payment: payment,
    userId: userId,
    status: "Pending",
    createdOn: Date.now(),
  });
 }else{
   newOrder = new Order({
    product: orderedProducts,
    totalPrice: totalPrice,
    address: desiredAddress,
    payment: payment,
    userId: userId,
    status: "Confirmed",
    createdOn: Date.now(),
  });
 }
  
      let orderDone = await newOrder.save();

      await User.updateOne({ _id: userId }, { $set: { cart: [] } });

      // console.log('thsi is new order',newOrder);

      for (let i = 0; i < orderedProducts.length; i++) {
        const product = await Product.findOne({ _id: orderedProducts[i]._id });

        
        if (product) {
          const newQuantity = product.quantity - orderedProducts[i].quantity;
          product.quantity = Math.max(newQuantity, 0);
          await product.save();
        }
      }

     

      if (newOrder.payment == "cod") {
        console.log("order placed by cod");
        res.json({
          payment: true,
          method: "cod",
          order: orderDone,
          quantity: cartItemQuantities,
          orderId: findUser,
        });
      } else if (newOrder.payment == "wallet") {
        console.log("order placed by wallet");
        if (newOrder.totalPrice <= findUser.wallet) {
          console.log("order placed with Wallet");
          const data = (findUser.wallet -= newOrder.totalPrice);
          const newHistory = {
            amount: data,
            status: "debit",
            date: Date.now(),
          };
          findUser.history.push(newHistory);
          await findUser.save();

          orderDone = await newOrder.save();

          res.json({
            payment: true,
            method: "wallet",
            order: orderDone,
            orderId: orderDone._id,
            quantity: cartItemQuantities,
            success: true,
          });
          return;
        } else {
          console.log("wallet amount is lesser than total amount");
          res.json({ payment: false, method: "wallet", success: false });
          return;
        }
      } else if (newOrder.payment == "razorpay") {
        console.log("order placed by razorpay");
        orderDone = await newOrder.save();
        console.log(orderDone, "okoo");
        let razorPaygenaratedOrder = await generateOrderRazorpay(
          orderDone._id,
          orderDone.totalPrice
        );
        console.log(razorPaygenaratedOrder, "ordr bgen");
        res.json({
          payment: false,
          method: "razorpay",
          razorPayOrder: razorPaygenaratedOrder,
          order: orderDone,
          quantity: cartItemQuantities,
        });
      }
    } else {
      console.log("Address not found");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getOrderDetailsPage = async (req, res) => {
  try {
    console.log("vatto");
    console.log(req.query, "query ann");
    const userId = req.session.user;
    const orderId = req.query.id;

    console.log(req.query.id);
    console.log(userId);
    console.log(orderId, "orderid ann");
    const findOrder = await Order.findOne({ _id: orderId });
    const findUser = await User.findOne({ _id: userId });
    console.log(findOrder, "kanikkk");
    res.render("orderDetails", { orders: findOrder, user: findUser });
  } catch (error) {
    console.log(error.message);
  }
};
const paymentConfirm=async(req,res)=>{
  try {
    console.log(req.body,"body hain");
    await Order.updateOne({_id : req.body.orderId},{$set:{status:"Confirmed"}})
    .then((data)=>{
      console.log(data,"data hain");
      res.json({status:true})

    })



  } catch (error) {
    console.log(error.message);
    
  }
}

const getOrderListPageAdmin = async (req, res) => {
  console.log("varndo");
  try {
    const orders = await Order.find({}).sort({ createdOn: -1 });

    // console.log(req.query);

    let itemsPerPage = 3;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);

    res.render("order-list", { orders: currentOrder, totalPages, currentPage });
  } catch (error) {
    console.log(error.message);
  }
};

const changeOrderStatus = async (req, res) => {
  console.log("heyyylo");

  try {
    console.log(req.query);

    const orderId = req.query.orderId;
    console.log(orderId);

    await Order.updateOne({ _id: orderId }, { status: req.query.status }).then(
      (data) => console.log(data)
    );

    res.redirect("/admin/orderList");
  } catch (error) {
    console.log(error.message);
  }
};

const getCartCheckoutPage = async (req, res) => {
  try {
    res.render("checkoutCart");
  } catch (error) {
    console.log(error.message);
  }
};

const getOrderDetailsPageAdmin = async (req, res) => {
  try {
    const orderId = req.query.id;
    // console.log(orderId);
    const findOrder = await Order.findOne({ _id: orderId }).sort({
      createdOn: 1,
    });
    // console.log(findOrder);

    res.render("order-details-admin", { orders: findOrder, orderId });
  } catch (error) {
    console.log(error.message);
  }
};

const changeSingleProductStatus = async (req,res)=>{
  console.log("caling");
  const { orderId,singleProductId,status} = req.body
  const oid = new mongodb.ObjectId(singleProductId);
  const order =  await Order.findOne({_id:orderId})
  console.log(order,"order");
  const productIndex = order.product.findIndex(product => product._id.toString() === singleProductId);
  const orderedProductDataPrice = order.product[productIndex].price;
  const newPrice = order.totalPrice-orderedProductDataPrice;
        try{
        const filter = {
          _id: orderId,
        };
        const update = {
          $set: {
            'product.$[elem].productStatus': status,
            totalPrice:newPrice
          }
        };
        const options = {
          arrayFilters: [
            { 'elem._id': oid }
          ]
        };
        const result = await Order.updateOne(filter, update, options)
        res.status(200).json({ message: 'Product status updated successfully', result });
      }catch{

      }
}

const cancelorder = async (req, res) => {
  console.log(req.body, "pkpk");
  try {
    console.log("im yes");
    const userId = req.session.user;
    const findUser = await User.findOne({ _id: userId });

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderId = req.query.orderId;
    console.log(orderId, "id hain");

    await Order.updateOne({ _id: orderId }, { status: "Canceled" }).then(
      (data) => console.log(data)
    );

    const findOrder = await Order.findOne({ _id: orderId });
    console.log(findOrder, "0k bei");
    for (const productData of findOrder.product) {
      console.log(productData, " productData");
      const productId = productData._id;
      const quantity = productData.quantity;
      console.log(productId, "ppppp");
      console.log(quantity, "qqqqq");

      const product = await Product.findById(productId);

      console.log(product, "=>>>>>>>>>");

      if (product) {
        product.quantity += quantity;
        await product.save();
      } else if (!product) {
        console.log("nah product");
      }
    }

    res.redirect("/userprofile");
  } catch (error) {
    console.log(error.message);
  }
};

const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
    const options = {
      amount: total * 100,
      currency: "INR",
      receipt: String(orderId),
    };
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.log("failed");
        console.log(err, "");
        reject(err);
      } else {
        console.log("Order Generated RazorPAY: " + JSON.stringify(order));
        resolve(order);
      }
    });
  });
};

const verify = (req, res) => {
  console.log(req.body, "verify req-body");
  let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(
    `${req.body.payment.razorpay_order_id}|${req.body.payment.razorpay_payment_id}`
  );
  hmac = hmac.digest("hex");
  // console.log(hmac,"HMAC");
  // console.log(req.body.payment.razorpay_signature,"signature");
  if (hmac === req.body.payment.razorpay_signature) {
    console.log("true");
    res.json({ status: true });
  } else {
    console.log("false");
    res.json({ status: false });
  }
};



module.exports = {
  getCheckoutPage,
  cancelorder,
  orderPlaced,
  changeOrderStatus,
  getOrderDetailsPage,
  getOrderListPageAdmin,
  getCartCheckoutPage,
  getOrderDetailsPageAdmin,
  verify,
  changeSingleProductStatus,
  paymentConfirm
};
