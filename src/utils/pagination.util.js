const getPaginationParams = (query) => {
  const page = parseInt(query.page) || 1
  const limit = parseInt(query.limit) || 20
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

const buildPaginationResponse = (page, limit, total) => {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  }
}

module.exports = { getPaginationParams, buildPaginationResponse }
