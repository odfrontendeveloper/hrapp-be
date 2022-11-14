export const calcPaginate = (
    totalItem: number,
    limit: number,
    page: number
): { take: number; skip: number; totalPages: number; page: number } => {
    if (totalItem === 0) {
        return { take: 0, skip: 0, totalPages: 1, page: 1 }
    }
    const totalPages = totalItem % limit ? (totalItem - (totalItem % limit) + limit) / limit : totalItem / limit
    if (page > totalPages) page = totalPages
    return { take: limit, skip: limit * page - limit, totalPages, page }
}
