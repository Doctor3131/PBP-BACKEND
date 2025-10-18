const fs = require('fs').promises
const path = require('path')
const pool = require('../utils/config/database')
const logger = require('../utils/logger')

const imageDir = path.join(__dirname, '../public/images/products')
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Get all image files in the products directory
 */
const getAllImageFiles = async () => {
  try {
    const files = await fs.readdir(imageDir)

    return files.filter(file => {
      const ext = path.extname(file).toLowerCase()

      return SUPPORTED_EXTENSIONS.includes(ext) && file !== 'placeholder.jpg'
    })
  } catch (error) {
    logger.error(`Error reading image directory: ${error.message}`)

    return []
  }
}

/**
 * Parse product ID from filename
 */
const parseProductIdFromFilename = (filename) => {
  const match = filename.match(/^(\d+)/)

  return match ? parseInt(match[1]) : null
}

/**
 * Check for orphaned images (images without corresponding products)
 */
const findOrphanedImages = async () => {
  logger.info('Checking for orphaned images...')

  const imageFiles = await getAllImageFiles()
  const orphanedImages = []

  for (const file of imageFiles) {
    const productId = parseProductIdFromFilename(file)

    if (!productId) continue

    const result = await pool.query('SELECT id FROM products WHERE id = $1', [productId])

    if (result.rows.length === 0) {
      orphanedImages.push({
        filename: file,
        productId: productId,
        path: path.join(imageDir, file),
      })
    }
  }

  if (orphanedImages.length === 0) {
    logger.info('✓ No orphaned images found')
  } else {
    logger.warn(`Found ${orphanedImages.length} orphaned images:`)
    orphanedImages.forEach(img => {
      logger.warn(`  - ${img.filename} (Product ID: ${img.productId})`)
    })
  }

  return orphanedImages
}

/**
 * Find products without images
 */
const findProductsWithoutImages = async () => {
  logger.info('Checking for products without images...')

  const result = await pool.query(`
    SELECT p.id, p.name, p.category_id, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    ORDER BY p.category_id, p.id
  `)

  const imageFiles = await getAllImageFiles()
  const productsWithImages = new Set(
    imageFiles.map(file => parseProductIdFromFilename(file)).filter(id => id !== null),
  )

  const productsWithoutImages = result.rows.filter(
    product => !productsWithImages.has(product.id),
  )

  if (productsWithoutImages.length === 0) {
    logger.info('✓ All products have images')
  } else {
    logger.warn(`Found ${productsWithoutImages.length} products without images:`)

    // Group by category
    const byCategory = {}

    productsWithoutImages.forEach(product => {
      const categoryName = product.category_name || 'Uncategorized'

      if (!byCategory[categoryName]) {
        byCategory[categoryName] = []
      }

      byCategory[categoryName].push(product)
    })

    Object.keys(byCategory).forEach(category => {
      logger.warn(`  ${category}:`)
      byCategory[category].forEach(product => {
        logger.warn(`    - ID ${product.id}: ${product.name}`)
      })
    })
  }

  return productsWithoutImages
}

/**
 * Generate report of image statistics by category
 */
const generateImageStatistics = async () => {
  logger.info('Generating image statistics...')

  const result = await pool.query(`
    SELECT 
      c.id as category_id,
      c.name as category_name,
      COUNT(p.id) as total_products,
      COUNT(p.id) FILTER (WHERE p.is_active = true) as active_products
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name
  `)

  const imageFiles = await getAllImageFiles()
  const productsWithImages = new Set(
    imageFiles.map(file => parseProductIdFromFilename(file)).filter(id => id !== null),
  )

  const stats = []

  for (const category of result.rows) {
    const categoryProducts = await pool.query(
      'SELECT id FROM products WHERE category_id = $1 AND is_active = true',
      [category.category_id],
    )

    const productsWithImagesCount = categoryProducts.rows.filter(
      p => productsWithImages.has(p.id),
    ).length

    const coverage = category.active_products > 0
      ? ((productsWithImagesCount / category.active_products) * 100).toFixed(1)
      : '0.0'

    stats.push({
      category: category.category_name,
      totalProducts: category.total_products,
      activeProducts: category.active_products,
      productsWithImages: productsWithImagesCount,
      coveragePercent: parseFloat(coverage),
    })
  }

  logger.info('\nImage Coverage by Category:')
  logger.info('═'.repeat(70))
  stats.forEach(stat => {
    const bar = '█'.repeat(Math.floor(stat.coveragePercent / 5))
    const emptyBar = '░'.repeat(20 - Math.floor(stat.coveragePercent / 5))

    logger.info(
      `${stat.category.padEnd(25)} [${bar}${emptyBar}] ${stat.coveragePercent}% (${stat.productsWithImages}/${stat.activeProducts})`,
    )
  })
  logger.info('═'.repeat(70))

  return stats
}

/**
 * Clean up orphaned images (with confirmation)
 */
const cleanupOrphanedImages = async (dryRun = true) => {
  const orphanedImages = await findOrphanedImages()

  if (orphanedImages.length === 0) {
    logger.info('No orphaned images to clean up')

    return
  }

  if (dryRun) {
    logger.info('\n🔍 DRY RUN MODE - No files will be deleted')
    logger.info(`Would delete ${orphanedImages.length} orphaned images`)

    return orphanedImages
  }

  logger.warn(`\n⚠️  DELETING ${orphanedImages.length} orphaned images...`)

  let deletedCount = 0

  for (const img of orphanedImages) {
    try {
      await fs.unlink(img.path)
      logger.info(`  ✓ Deleted: ${img.filename}`)
      deletedCount++
    } catch (error) {
      logger.error(`  ✗ Failed to delete ${img.filename}: ${error.message}`)
    }
  }

  logger.info(`\n✓ Successfully deleted ${deletedCount} out of ${orphanedImages.length} orphaned images`)

  return deletedCount
}

/**
 * Main audit function
 */
const auditProductImages = async () => {
  try {
    logger.info('═'.repeat(70))
    logger.info('PRODUCT IMAGES AUDIT')
    logger.info('═'.repeat(70))
    logger.info('')

    // 1. Generate statistics
    await generateImageStatistics()
    logger.info('')

    // 2. Find orphaned images
    await findOrphanedImages()
    logger.info('')

    // 3. Find products without images
    await findProductsWithoutImages()
    logger.info('')

    logger.info('═'.repeat(70))
    logger.info('AUDIT COMPLETE')
    logger.info('═'.repeat(70))

  } catch (error) {
    logger.error('Error during audit:', error)
    throw error
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0] || 'audit'

    (async () => {
      try {
        switch (command) {
          case 'audit':
            await auditProductImages()
            break

          case 'orphaned':
            await findOrphanedImages()
            break

          case 'missing':
            await findProductsWithoutImages()
            break

          case 'stats':
            await generateImageStatistics()
            break

          case 'cleanup':
            const dryRun = !args.includes('--force')

            await cleanupOrphanedImages(dryRun)

            if (dryRun) {
              logger.info('\nTo actually delete files, run: node utils/imageManagement.js cleanup --force')
            }

            break

          default:
            logger.info('Usage: node utils/imageManagement.js [command]')
            logger.info('\nCommands:')
            logger.info('  audit     - Run complete audit (default)')
            logger.info('  orphaned  - Find orphaned images')
            logger.info('  missing   - Find products without images')
            logger.info('  stats     - Show image statistics by category')
            logger.info('  cleanup   - Clean up orphaned images (dry run)')
            logger.info('  cleanup --force - Actually delete orphaned images')
        }

        await pool.end()
        process.exit(0)
      } catch (error) {
        logger.error('Command failed:', error)
        await pool.end()
        process.exit(1)
      }
    })()
}

module.exports = {
  auditProductImages,
  findOrphanedImages,
  findProductsWithoutImages,
  generateImageStatistics,
  cleanupOrphanedImages,
}
