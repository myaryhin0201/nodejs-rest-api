/* eslint-disable promise/param-names */
const Users = require('../model/schemaUser')
const { sendEmail } = require('./emailServices')
const cloudinary = require('cloudinary').v2
const fs = require('fs/promises')
require('dotenv').config()
const { nanoid } = require('nanoid')

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
})

const getUserById = async (id) => {
  return await Users.findById(id)
}

const getUserByEmail = async (email) => {
  return await Users.findOne({ email })
}

const addUser = async (body) => {
  const verifyToken = nanoid()
  const { email } = body
  await sendEmail(verifyToken, email)
  const user = await Users({ ...body, verifyToken })
  return user.save()
}

const updateToken = async (id, token) => {
  await Users.updateOne({ _id: id }, { token })
}

const userUpdateSubscription = async (id, subscription) => {
  if (Users.schema.path('subscription').enumValues.includes(subscription)) {
    await Users.updateOne({ id: id, subscription: subscription })
  }
  console.log('Not valid subscription')
}

const uploadCloud = (pathFile) => {
  return new Promise((res, rej) => {
    cloudinary.uploader.upload(
      pathFile,
      { folder: 'Avatars', transformation: { width: 250, crop: 'fill' } },
      (error, result) => {
        if (error) rej(error)
        if (result) res(result)
      }
    )
  })
}

const updateAvatar = async (id, pathFile) => {
  try {
    const { secure_url: avatar, public_id: idCloudAvatar } = await uploadCloud(
      pathFile
    )
    const oldAvatar = await Users.findOne({ _id: id })
    cloudinary.uploader.destroy(oldAvatar.idCloudAvatar, (err, res) => {
      if (err) {
        console.log(err)
        return
      }
      console.log(res)
    })
    await Users.updateOne({ _id: id }, { avatarURL: avatar, idCloudAvatar })
    await fs.unlink(pathFile)
    return avatar
  } catch (error) {
    console.log(error.message)
  }
}

const verify = async ({ token }) => {
  const user = await Users.findOne({ verifyToken: token })
  if (user) {
    await user.updateOne({ verify: true, verifyToken: null })
    return true
  }
  return false
}

const reVerify = async (email) => {
  const user = await Users.findOne({ email, verify: false })

  if (user) {
    await sendEmail(user.verifyToken, email)
    return true
  }
}

module.exports = {
  getUserById,
  getUserByEmail,
  addUser,
  updateToken,
  userUpdateSubscription,
  updateAvatar,
  verify,
  reVerify
}
