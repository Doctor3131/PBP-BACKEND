const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const uploadDir = path.join(__dirname, '../../public/images/products')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const productId = req.body.product_id || req.params.id
    const imageNumber = req.body.image_number || ''
    const ext = path.extname(file.originalname).toLowerCase()

    // If uploading multiple images, add timestamp to avoid conflicts
    const isMultiple = Array.isArray(req.files) || req.body.is_multiple === 'true'

    let filename

    if (imageNumber) {
      // Specific numbered image: productId-number.ext
      filename = `${productId}-${imageNumber}${ext}`
    } else if (isMultiple) {
      // Multiple upload: generate sequential numbers
      const timestamp = Date.now()
      const random = crypto.randomBytes(2).toString('hex')

      filename = `${productId}-${timestamp}-${random}${ext}`
    } else {
      // Single main image: productId.ext
      filename = `${productId}${ext}`
    }

    cb(null, filename)
  },
})

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (extname && mimetype) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'))
  }
}

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files at once
  },
  fileFilter: fileFilter,
})

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB',
      })
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 5 files at once',
      })
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload',
      })
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }

  next()
}

module.exports = {
  upload,
  handleMulterError,
}
