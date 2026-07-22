/** Chỉ dùng trong quá trình phát triển để test trạng thái loading */
export const delay = (ms = 250): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))
