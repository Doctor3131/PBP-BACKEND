const path = require('path')
const fs = require('fs')
const { successResponse, errorResponse } = require('../utils/response.util')
const { NotFoundError } = require('../utils/errors')
const imageDir = path.join(__dirname, '../../public/images/products')

const getProductImage = (req, res, next) => {
  try {
    const productId = req.params.id

    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
    let imagePath = null

    for (const ext of extensions) {
      const testPath = path.join(imageDir, `${productId}${ext}`)

      if (fs.existsSync(testPath)) {
        imagePath = testPath
        break
      }
    }

    if (!imagePath) {
      const placeholderPath = path.join(imageDir, 'placeholder.jpg')

      if (fs.existsSync(placeholderPath)) {
        return res.sendFile(placeholderPath)
      }

      throw new NotFoundError('Image not found')
    }

    res.sendFile(imagePath)
  } catch (error) {
    next(error)
  }
}

const getProductImageByNumber = (req, res, next) => {
  try {
    const { id, number } = req.params

    const extensions = ['.jpg', '.jpeg', '.png', '.webp']
    let imagePath = null

    for (const ext of extensions) {
      const testPath = path.join(imageDir, `${id}-${number}${ext}`)

      if (fs.existsSync(testPath)) {
        imagePath = testPath
        break
      }
    }

    if (!imagePath) {
      throw new NotFoundError('Image not found')
    }

    res.sendFile(imagePath)
  } catch (error) {
    next(error)
  }
}

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400)
    }

    const imageUrl = `/images/products/${req.file.filename}`

    return successResponse(res, {
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
    }, 201, 'Image uploaded successfully')
  } catch (error) {
    next(error)
  }
}

const uploadMultipleProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400)
    }

    const images = req.files.map(file => ({
      filename: file.filename,
      url: `/images/products/${file.filename}`,
      size: file.size,
    }))

    return successResponse(res, {
      count: images.length,
      images,
    }, 201, `${images.length} images uploaded successfully`)
  } catch (error) {
    next(error)
  }
}

const deleteProductImage = async (req, res, next) => {
  try {
    const { id, number } = req.params

    const filename = number ? `${id}-${number}` : id
    const extensions = ['.jpg', '.jpeg', '.png', '.webp']

    let deleted = false

    for (const ext of extensions) {
      const imagePath = path.join(imageDir, `${filename}${ext}`)

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
        deleted = true
        break
      }
    }

    if (!deleted) {
      throw new NotFoundError('Image not found')
    }

    return successResponse(res, null, 200, 'Image deleted successfully')
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getProductImage,
  getProductImageByNumber,
  uploadProductImage,
  uploadMultipleProductImages,
  deleteProductImage,
}
