export class AppError extends Error {
  constructor(code, message, status) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'AppError'
  }
}

export function normalizeSupabaseError(error) {
  // If it's already an AppError, return it directly
  if (error instanceof AppError) {
    return error
  }

  // Handle generic / undefined errors
  if (!error) {
    return new AppError('UNKNOWN_ERROR', 'Terjadi kesalahan sistem.', 500)
  }

  // Network / Fetch error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('NETWORK_ERROR', 'Koneksi jaringan terputus. Mohon periksa internet Anda.', 0)
  }

  const errCode = error.code || error.error_code
  const errMessage = error.message || error.error_description || ''
  const status = error.status || 500

  // 1. Auth & Session Errors (B) Temporary 401 / fetch issue
  if (status === 401 || errMessage.toLowerCase().includes('jwt expired') || errMessage.toLowerCase().includes('unauthorized')) {
    return new AppError('AUTH_SESSION_EXPIRED', 'Sesi kedaluwarsa atau tidak valid.', 401)
  }

  // 2. RLS / Permission Errors
  if (errCode === '42501') {
    return new AppError('INSUFFICIENT_PRIVILEGE', 'Akses ditolak. Anda tidak memiliki izin untuk melihat atau mengubah data ini.', 403)
  }

  // 3. PostgREST No Rows
  if (errCode === 'PGRST116') {
    return new AppError('NOT_FOUND', 'Data tidak ditemukan.', 404)
  }

  // 4. Custom exceptions (Postgres RAISE EXCEPTION or Business Logic)
  const msgUpper = errMessage.toUpperCase()
  
  if (msgUpper.includes('QUOTA_EXCEEDED') || msgUpper.includes('QUOTA')) {
    return new AppError('QUOTA_EXCEEDED', 'Batas kuota transaksi tercapai. Silakan upgrade paket Anda.', 402)
  }
  
  if (msgUpper.includes('STOK TIDAK CUKUP') || msgUpper.includes('INSUFFICIENT_STOCK')) {
    return new AppError('INSUFFICIENT_STOCK', 'Stok produk tidak mencukupi untuk transaksi ini.', 400)
  }

  if (msgUpper.includes('UNAUTHORIZED') && !errCode) {
    return new AppError('UNAUTHORIZED_ACTION', 'Aksi tidak diizinkan.', 403)
  }

  // Fallback for custom SQL Exceptions (like P0001) that aren't specifically mapped
  if (errCode === 'P0001') {
    return new AppError('BUSINESS_LOGIC_ERROR', errMessage, 400)
  }

  // Fallback for all other errors
  return new AppError(errCode || 'UNKNOWN_ERROR', errMessage || 'Terjadi kesalahan yang tidak diketahui.', status)
}
