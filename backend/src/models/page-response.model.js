class PageResponse {
  constructor({ currentPage, pageSize, totalPages, totalElements, isLast, data }) {
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.totalPages = totalPages;
    this.totalElements = totalElements;
    this.isLast = isLast;
    this.data = data;
  }

  /**
   * @param {number} currentPage - trang hiện tại (đếm từ 1, khớp giá trị client đã gửi lên)
   * @param {number} pageSize - số phần tử mỗi trang
   * @param {number} totalElements - tổng số bản ghi khớp điều kiện lọc (chưa phân trang)
   * @param {Array} data - dữ liệu của đúng trang này
   */
  static of({ currentPage, pageSize, totalElements, data }) {
    const totalPages = pageSize > 0 ? Math.ceil(totalElements / pageSize) : 0;
    return new PageResponse({
      currentPage,
      pageSize,
      totalPages,
      totalElements,
      isLast: currentPage >= totalPages,
      data,
    });
  }

  toJSON() {
    return {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalPages: this.totalPages,
      totalElements: this.totalElements,
      isLast: this.isLast,
      data: this.data,
    };
  }
}

module.exports = PageResponse;