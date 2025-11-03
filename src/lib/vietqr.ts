export type VietQRConfig = {
  bankId: string // Mã ngân hàng (VD: "970422" cho MBBank)
  accountNo: string // Số tài khoản
  accountName: string // Tên tài khoản
  template?: string // Template QR (default: "compact")
}

export type GenerateVietQRParams = {
  amount: number
  description: string // Nội dung chuyển khoản (sẽ chứa mã giao dịch)
  config: VietQRConfig
}

/**
 * Tạo URL QR code VietQR động
 * API docs: https://api.vietqr.io/docs
 */
export function generateVietQRUrl({
  amount,
  description,
  config,
}: GenerateVietQRParams): string {
  const { bankId, accountNo, accountName, template = 'compact' } = config

  // Encode description để đảm bảo không có ký tự đặc biệt
  const encodedDescription = encodeURIComponent(description)

  // VietQR API endpoint cho việc tạo QR code
  const url = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedDescription}&accountName=${encodeURIComponent(accountName)}`

  return url
}

/**
 * Lấy config VietQR từ environment variables
 */
export function getVietQRConfig(): VietQRConfig {
  const bankId = process.env.VIETQR_BANK_ID
  const accountNo = process.env.VIETQR_ACCOUNT_NO
  const accountName = process.env.VIETQR_ACCOUNT_NAME

  if (!bankId || !accountNo || !accountName) {
    throw new Error(
      'Missing VietQR configuration. Please set VIETQR_BANK_ID, VIETQR_ACCOUNT_NO, and VIETQR_ACCOUNT_NAME in environment variables.'
    )
  }

  return {
    bankId,
    accountNo,
    accountName,
    template: process.env.VIETQR_TEMPLATE || 'compact',
  }
}

/**
 * Tạo nội dung chuyển khoản với mã giao dịch
 */
export function generatePaymentDescription(transactionCode: string): string {
  return `Thanh toan don hang ${transactionCode}`
}
