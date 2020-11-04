const moment = require('moment-timezone')

function CampaignRepository({ Campaign }) {
  const create = async (ownerId, brandId, products) => {
    const expires = moment().add(7, 'days').toDate()

    const campaign = {
      ownerId, brandId, products, expires,
    }

    await Campaign.create(campaign)

    return campaign
  }

  const getForBrand = async (brandId, page, limit) => {
    const [results, total] = await Promise.all([
      Campaign.find({ brandId })
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('ownerId')
        .exec(),
      Campaign.countDocuments({ brandId }),
    ])

    return { campaigns: results, total }
  }

  return { create, getForBrand }
}

module.exports = CampaignRepository
