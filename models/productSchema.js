const mongoose = require("mongoose");

const { Schema } = mongoose;

const productSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    category: {
        type: Schema.Types.ObjectId, // Change type to ObjectId
        ref: 'Category', // Reference to the 'Category' model
        required: true,
    },
    regularPrice: {
        type: Number,
        required: true,
    },
    salePrice: {
        
        type: Number,
        required: true,
    },
    createdOn: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    productImage: {
        type: Array,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: false,
    },
    productOffer: {
        type: Number,
        default: 0,
    },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
