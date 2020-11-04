const httpStatus = require('http-status')
const APIError = require('../../utils/APIError')

module.exports = ({ usersRepository }) => {
  const addProfile = async (req, res, next) => {
    try {
      const profile = await usersRepository.createProfile(req.user.id, req.body)

      if (profile) {
        res.status(httpStatus.CREATED).json(profile)
      } else {
        next(new APIError({
          message: 'User does not exist',
          status: httpStatus.NOT_FOUND,
        }))
      }
    } catch (error) {
      next(error)
    }
  }

  return {
    addProfile,
  }
}
