export interface PaginationMeta {
    total:       number;
    page:        number;
    limit:       number;
    totalPages:  number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }

  export interface PaginatedResult<T> {
    data: T[];
    meta: PaginationMeta;
  }

  export function paginate(total: number, page: number, limit: number): PaginationMeta {
    const totalPages  = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  export function getPaginationParams(page = 1, limit = 10) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    return { take, skip };
  }
