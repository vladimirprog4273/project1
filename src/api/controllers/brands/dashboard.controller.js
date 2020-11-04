module.exports = ({ campaignRepository }) => {
  const getCampaigns = async (req, res, next) => {
    try {
      const { page, limit } = req.query
      const { campaigns, total } = await campaignRepository.getForBrand(req.user.id, page, limit)

      res.json({ campaigns, total })
    } catch (error) {
      next(error)
    }
  }

  return {
    getCampaigns,
  }
}
