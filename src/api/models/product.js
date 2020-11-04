const mongoose = require('mongoose')

const stockTypes = ['clothes', 'shoes', 'jewelry']

const productSchema = {
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  outOfStock: Boolean,
  type: String,
  sizes: String,
}

module.exports = { productSchema, stockTypes }
