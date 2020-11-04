const httpStatus = require('http-status')
const APIError = require('../../utils/APIError')

module.exports = ({ usersRepository, productsRepository, campaignRepository }) => {
  const createCampaign = async (req, res, next) => {
    try {
      const { brandId } = req.body
      const user = await usersRepository.findById(brandId)

      if (user) {
        if (user.role === 'brand') {
          const products = await productsRepository.getList(req.body.products)

          const brandChecked = products.every(({ ownerId }) => ownerId === brandId)

          if (brandChecked) {
            const campaign = await campaignRepository.create(req.user.id, brandId, products)
            res.status(httpStatus.CREATED).json(campaign)
          } else {
            next(new APIError({
              message: 'Invalid products list',
              status: httpStatus.BAD_REQUEST,
            }))
          }
        } else {
          next(new APIError({
            message: 'User is not brand',
            status: httpStatus.BAD_REQUEST,
          }))
        }
      } else {
        next(new APIError({
          message: 'User does not exist',
          status: httpStatus.BAD_REQUEST,
        }))
      }
    } catch (error) {
      next(error)
    }
  }

  const getBrandsList = async (req, res, next) => {
    try {
      const page = Number(req.query.page)
      const limit = Number(req.query.limit)

      const { brands, total } = await usersRepository.getBrandsList(page, limit)

      res.json({ brands, total })
    } catch (error) {
      next(error)
    }
  }

  return {
    createCampaign,
    getBrandsList,
  }
}
