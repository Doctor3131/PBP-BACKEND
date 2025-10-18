const fs = require('fs').promises
const path = require('path')
const logger = require('../../utils/logger')

const imageDir = path.join(__dirname, '../../public/images/products')
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Image Service - Helper functions for image operations
 */
class ImageService {
  /**
   * Check if a file exists
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath)

      return true
    } catch {
      return false
    }
  }

  /**
   * Find image with any supported extension
   */
  static async findImageWithExtension(baseFilename) {
    for (const ext of SUPPORTED_EXTENSIONS) {
      const imagePath = path.join(imageDir, `${baseFilename}${ext}`)

      if (await this.fileExists(imagePath)) {
        return imagePath
      }
    }

    return null
  }

  /**
   * Get all images for a product
   */
  static async getProductImages(productId) {
    const images = {
      main: null,
      additional: [],
    }

    // Check for main image
    const mainImage = await this.findImageWithExtension(productId.toString())

    if (mainImage) {
      images.main = {
        path: mainImage,
        url: `/images/products/${path.basename(mainImage)}`,
        filename: path.basename(mainImage),
      }
    }

    // Check for additional images (1-10)
    for (let i = 1; i <= 10; i++) {
      const additionalImage = await this.findImageWithExtension(`${productId}-${i}`)

      if (additionalImage) {
        images.additional.push({
          number: i,
          path: additionalImage,
          url: `/images/products/${path.basename(additionalImage)}`,
          filename: path.basename(additionalImage),
        })
      }
    }

    return images
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imagePath) {
    try {
      const stats = await fs.stat(imagePath)
      const ext = path.extname(imagePath).toLowerCase()

      return {
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size),
        extension: ext,
        mimetype: this.getMimeType(ext),
        created: stats.birthtime,
        modified: stats.mtime,
      }
    } catch (error) {
      logger.error(`Error getting image metadata: ${error.message}`)

      return null
    }
  }

  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  /**
   * Get MIME type from extension
   */
  static getMimeType(extension) {
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  /**
   * Validate image file
   */
  static validateImageFile(file) {
    const errors = []

    // Check if file exists
    if (!file) {
      errors.push('No file provided')

      return { valid: false, errors }
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size (${this.formatBytes(maxSize)})`)
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only JPEG, PNG, and WebP images are allowed')
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase()

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      errors.push('Invalid file extension')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Delete image file
   */
  static async deleteImage(imagePath) {
    try {
      if (await this.fileExists(imagePath)) {
        await fs.unlink(imagePath)
        logger.info(`Deleted image: ${imagePath}`)

        return true
      }

      return false
    } catch (error) {
      logger.error(`Error deleting image: ${error.message}`)
      throw error
    }
  }

  /**
   * Delete all images for a product
   */
  static async deleteAllProductImages(productId) {
    const deletedFiles = []

    // Delete main image
    for (const ext of SUPPORTED_EXTENSIONS) {
      const mainImagePath = path.join(imageDir, `${productId}${ext}`)

      if (await this.deleteImage(mainImagePath)) {
        deletedFiles.push(path.basename(mainImagePath))
      }
    }

    // Delete additional images
    for (let i = 1; i <= 10; i++) {
      for (const ext of SUPPORTED_EXTENSIONS) {
        const additionalImagePath = path.join(imageDir, `${productId}-${i}${ext}`)

        if (await this.deleteImage(additionalImagePath)) {
          deletedFiles.push(path.basename(additionalImagePath))
        }
      }
    }

    return deletedFiles
  }

  /**
   * Rename product images when product ID changes
   */
  static async renameProductImages(oldProductId, newProductId) {
    const renamedFiles = []
    const images = await this.getProductImages(oldProductId)

    // Rename main image
    if (images.main) {
      const ext = path.extname(images.main.path)
      const newPath = path.join(imageDir, `${newProductId}${ext}`)

      await fs.rename(images.main.path, newPath)
      renamedFiles.push({
        old: images.main.filename,
        new: path.basename(newPath),
      })
    }

    // Rename additional images
    for (const img of images.additional) {
      const ext = path.extname(img.path)
      const newPath = path.join(imageDir, `${newProductId}-${img.number}${ext}`)

      await fs.rename(img.path, newPath)
      renamedFiles.push({
        old: img.filename,
        new: path.basename(newPath),
      })
    }

    return renamedFiles
  }

  /**
   * Copy image from one product to another
   */
  static async copyProductImage(sourceProductId, targetProductId) {
    const sourceImage = await this.findImageWithExtension(sourceProductId.toString())

    if (!sourceImage) {
      throw new Error(`Source product ${sourceProductId} has no image`)
    }

    const ext = path.extname(sourceImage)
    const targetPath = path.join(imageDir, `${targetProductId}${ext}`)

    await fs.copyFile(sourceImage, targetPath)

    logger.info(`Copied image from product ${sourceProductId} to ${targetProductId}`)

    return {
      source: path.basename(sourceImage),
      target: path.basename(targetPath),
      url: `/images/products/${path.basename(targetPath)}`,
    }
  }

  /**
   * Get total size of all product images
   */
  static async getTotalImageSize() {
    try {
      const files = await fs.readdir(imageDir)
      let totalSize = 0

      for (const file of files) {
        if (file === 'placeholder.jpg') continue

        const ext = path.extname(file).toLowerCase()

        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          const filePath = path.join(imageDir, file)
          const stats = await fs.stat(filePath)

          totalSize += stats.size
        }
      }

      return {
        bytes: totalSize,
        formatted: this.formatBytes(totalSize),
      }
    } catch (error) {
      logger.error(`Error calculating total image size: ${error.message}`)

      return { bytes: 0, formatted: '0 Bytes' }
    }
  }

  /**
   * Optimize image filename for SEO and consistency
   */
  static generateOptimalFilename(productId, productName, imageNumber = null) {
    // Sanitize product name for URL
    const sanitized = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // Limit length

    const base = imageNumber
      ? `${productId}-${imageNumber}-${sanitized}`
      : `${productId}-${sanitized}`

    return base
  }
}

module.exports = ImageService
