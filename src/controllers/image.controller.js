const path = require('path')
const fs = require('fs').promises
const { successResponse, errorResponse } = require('../utils/response.util')
const { NotFoundError } = require('../utils/error.util')
const productRepository = require('../repositories/product.repository')
const logger = require('../../utils/logger')

const imageDir = path.join(__dirname, '../../public/images/products')
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const PLACEHOLDER_FILENAME = 'placeholder.jpg'

const findImageWithExtension = async (baseFilename) => {
  for (const ext of SUPPORTED_EXTENSIONS) {
    const imagePath = path.join(imageDir, `${baseFilename}${ext}`)

    try {
      await fs.access(imagePath)

      return imagePath
    } catch {
      continue
    }
  }

  return null
}

const findCategoryFallbackImage = async (productId) => {
  try {
    const product = await productRepository.findById(productId)

    if (!product || !product.category_id) {
      return null
    }

    logger.info(`Finding fallback image for product ${productId} in category ${product.category_id}`)

    const categoryProducts = await productRepository.findAll(
      { category_id: product.category_id },
      { limit: 100, offset: 0 },
    )

    for (const categoryProduct of categoryProducts) {
      if (categoryProduct.id === productId) continue

      const imagePath = await findImageWithExtension(categoryProduct.id.toString())

      if (imagePath) {
        logger.info(`Using fallback image from product ${categoryProduct.id} for product ${productId}`)

        return imagePath
      }
    }

    return null
  } catch (error) {
    logger.error(`Error finding category fallback image: ${error.message}`)

    return null
  }
}

const getProductImagePath = async (productId, imageNumber = null) => {
  const baseFilename = imageNumber ? `${productId}-${imageNumber}` : productId.toString()

  let imagePath = await findImageWithExtension(baseFilename)

  if (imagePath) {
    return imagePath
  }

  if (imageNumber) {
    imagePath = await findImageWithExtension(productId.toString())

    if (imagePath) {
      logger.info(`Image ${imageNumber} not found, using main image for product ${productId}`)

      return imagePath
    }
  }

  imagePath = await findCategoryFallbackImage(productId)

  if (imagePath) {
    return imagePath
  }

  const placeholderPath = path.join(imageDir, PLACEHOLDER_FILENAME)

  try {
    await fs.access(placeholderPath)
    logger.info(`Using global placeholder for product ${productId}`)

    return placeholderPath
  } catch {
    throw new NotFoundError('No image available')
  }
}

const getProductImage = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)

    if (isNaN(productId) || productId <= 0) {
      return errorResponse(res, 'Invalid product ID', 400)
    }

    const imagePath = await getProductImagePath(productId)

    res.set({
      'Cache-Control': 'public, max-age=86400', // 24 hours
      'ETag': `"${productId}-${Date.now()}"`, // Simple ETag based on product ID
    })

    return res.sendFile(imagePath)
  } catch (error) {
    next(error)
  }
}

const getProductImageByNumber = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)
    const imageNumber = parseInt(req.params.number)

    if (isNaN(productId) || productId <= 0) {
      return errorResponse(res, 'Invalid product ID', 400)
    }

    if (isNaN(imageNumber) || imageNumber <= 0) {
      return errorResponse(res, 'Invalid image number', 400)
    }

    const imagePath = await getProductImagePath(productId, imageNumber)

    res.set({
      'Cache-Control': 'public, max-age=86400',
      'ETag': `"${productId}-${imageNumber}-${Date.now()}"`,
    })

    return res.sendFile(imagePath)
  } catch (error) {
    next(error)
  }
}

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400)
    }

    const productId = parseInt(req.params.id)
    const product = await productRepository.findById(productId)

    if (!product) {
      await fs.unlink(req.file.path)

      return errorResponse(res, 'Product not found', 404)
    }

    const imageUrl = `/images/products/${req.file.filename}`

    logger.info(`Image uploaded successfully for product ${productId}: ${req.file.filename}`)

    return successResponse(res, {
      product_id: productId,
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, 201, 'Image uploaded successfully')
  } catch (error) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => { })
    }

    next(error)
  }
}

const uploadMultipleProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'No files uploaded', 400)
    }

    const productId = parseInt(req.params.id)
    const product = await productRepository.findById(productId)

    if (!product) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => { })
      }

      return errorResponse(res, 'Product not found', 404)
    }

    const images = req.files.map(file => ({
      filename: file.filename,
      url: `/images/products/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    }))

    logger.info(`${images.length} images uploaded for product ${productId}`)

    return successResponse(res, {
      product_id: productId,
      count: images.length,
      images,
    }, 201, `${images.length} images uploaded successfully`)
  } catch (error) {
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => { })
      }
    }

    next(error)
  }
}

const deleteProductImage = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)
    const imageNumber = req.params.number ? parseInt(req.params.number) : null

    if (isNaN(productId) || productId <= 0) {
      return errorResponse(res, 'Invalid product ID', 400)
    }

    if (imageNumber !== null && (isNaN(imageNumber) || imageNumber <= 0)) {
      return errorResponse(res, 'Invalid image number', 400)
    }

    const baseFilename = imageNumber ? `${productId}-${imageNumber}` : productId.toString()
    let deleted = false
    let deletedPath = null

    for (const ext of SUPPORTED_EXTENSIONS) {
      const imagePath = path.join(imageDir, `${baseFilename}${ext}`)

      try {
        await fs.access(imagePath)
        await fs.unlink(imagePath)
        deleted = true
        deletedPath = imagePath
        logger.info(`Deleted image: ${imagePath}`)
        break
      } catch {
        continue
      }
    }

    if (!deleted) {
      throw new NotFoundError('Image not found')
    }

    const message = imageNumber
      ? `Image ${imageNumber} deleted successfully`
      : 'Image deleted successfully'

    return successResponse(res, {
      product_id: productId,
      image_number: imageNumber,
      deleted_file: path.basename(deletedPath),
    }, 200, message)
  } catch (error) {
    next(error)
  }
}

const getProductImageInfo = async (req, res, next) => {
  try {
    const productId = parseInt(req.params.id)

    if (isNaN(productId) || productId <= 0) {
      return errorResponse(res, 'Invalid product ID', 400)
    }

    const product = await productRepository.findById(productId)

    if (!product) {
      throw new NotFoundError('Product not found')
    }

    const images = []

    const mainImage = await findImageWithExtension(productId.toString())

    if (mainImage) {
      const stats = await fs.stat(mainImage)

      images.push({
        type: 'main',
        url: `/images/products/${path.basename(mainImage)}`,
        filename: path.basename(mainImage),
        size: stats.size,
        exists: true,
      })
    }

    for (let i = 1; i <= 5; i++) {
      const numberedImage = await findImageWithExtension(`${productId}-${i}`)

      if (numberedImage) {
        const stats = await fs.stat(numberedImage)

        images.push({
          type: 'additional',
          number: i,
          url: `/images/products/${path.basename(numberedImage)}`,
          filename: path.basename(numberedImage),
          size: stats.size,
          exists: true,
        })
      }
    }

    const fallbackImage = images.length === 0
      ? await findCategoryFallbackImage(productId)
      : null

    return successResponse(res, {
      product_id: productId,
      product_name: product.name,
      category_id: product.category_id,
      images_count: images.length,
      images,
      has_fallback: !!fallbackImage,
      fallback_url: fallbackImage ? `/images/products/${path.basename(fallbackImage)}` : null,
    })
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
  getProductImageInfo,
}
