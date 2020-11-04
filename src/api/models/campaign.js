const mongoose = require('mongoose')

const campaignSchema = {
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: {
    type: [String],
    required: true,
  },
  expires: {
    type: Date,
    required: true,
  },
}

module.exports = campaignSchema
