const { z } = require('zod');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const paginationQueryShape = {
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(MAX_LIMIT).optional(),
};

const hasPaginationQuery = (query = {}) => query.page !== undefined || query.limit !== undefined;

const normalizePagination = (query = {}) => {
  const page = Math.max(Number(query.page || DEFAULT_PAGE), DEFAULT_PAGE);
  const requestedLimit = Number(query.limit || DEFAULT_LIMIT);
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
  };
};

const buildPaginationMeta = ({ total, page, limit, count }) => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  return {
    total,
    count,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

const paginateList = (items = [], query = {}) => {
  if (!hasPaginationQuery(query)) {
    return {
      data: items,
      meta: {
        total: items.length,
        count: items.length,
      },
    };
  }

  const pagination = normalizePagination(query);
  const data = items.slice(pagination.offset, pagination.offset + pagination.limit);

  return {
    data,
    meta: buildPaginationMeta({
      total: items.length,
      count: data.length,
      page: pagination.page,
      limit: pagination.limit,
    }),
  };
};

module.exports = {
  buildPaginationMeta,
  normalizePagination,
  paginateList,
  paginationQueryShape,
};
