import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type SendEmailParams = {
  to: string
  subject: string
  html: string
  from?: string
}

/**
 * Gửi email sử dụng Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export type TicketEmailData = {
  customerName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  tickets: {
    ticketNumber: string
    ticketTypeName: string
    holderName: string
    qrCodeDataUrl: string
  }[]
  orderNumber: string
  totalAmount: number
}

/**
 * Tạo HTML template cho email gửi vé
 */
export function generateTicketEmailHtml(data: TicketEmailData): string {
  const { customerName, eventTitle, eventDate, eventLocation, tickets, orderNumber, totalAmount } = data

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vé sự kiện ${eventTitle}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 28px;
    }
    .event-info {
      background-color: #F3F4F6;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 30px;
    }
    .event-info h2 {
      margin-top: 0;
      color: #1F2937;
      font-size: 22px;
    }
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: bold;
      width: 120px;
      color: #6B7280;
    }
    .info-value {
      color: #1F2937;
    }
    .ticket-card {
      border: 2px solid #E5E7EB;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background-color: #FAFAFA;
    }
    .ticket-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px dashed #D1D5DB;
    }
    .ticket-type {
      font-size: 18px;
      font-weight: bold;
      color: #4F46E5;
    }
    .ticket-number {
      font-size: 14px;
      color: #6B7280;
      font-family: monospace;
    }
    .qr-code {
      text-align: center;
      margin: 20px 0;
    }
    .qr-code img {
      max-width: 200px;
      height: auto;
      border: 1px solid #E5E7EB;
      padding: 10px;
      background-color: white;
      border-radius: 4px;
    }
    .holder-name {
      text-align: center;
      font-size: 16px;
      color: #1F2937;
      margin-top: 10px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
      color: #6B7280;
      font-size: 14px;
    }
    .order-summary {
      background-color: #FEF3C7;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .order-summary p {
      margin: 5px 0;
    }
    .note {
      background-color: #FEE2E2;
      border-left: 4px solid #EF4444;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .note strong {
      color: #DC2626;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 VÉ THAM GIA SỰ KIỆN</h1>
    </div>

    <p>Xin chào <strong>${customerName}</strong>,</p>
    <p>Cảm ơn bạn đã đăng ký tham gia sự kiện của chúng tôi. Dưới đây là thông tin vé của bạn:</p>

    <div class="event-info">
      <h2>${eventTitle}</h2>
      <div class="info-row">
        <span class="info-label">Thời gian:</span>
        <span class="info-value">${eventDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Địa điểm:</span>
        <span class="info-value">${eventLocation}</span>
      </div>
    </div>

    <div class="order-summary">
      <p><strong>Mã đơn hàng:</strong> ${orderNumber}</p>
      <p><strong>Tổng tiền:</strong> ${totalAmount.toLocaleString('vi-VN')} VNĐ</p>
      <p><strong>Số lượng vé:</strong> ${tickets.length}</p>
    </div>

    <h3 style="color: #1F2937; margin-bottom: 20px;">Danh sách vé:</h3>

    ${tickets
      .map(
        (ticket) => `
    <div class="ticket-card">
      <div class="ticket-header">
        <span class="ticket-type">${ticket.ticketTypeName}</span>
        <span class="ticket-number">${ticket.ticketNumber}</span>
      </div>
      <div class="holder-name">
        <strong>Người tham dự:</strong> ${ticket.holderName}
      </div>
      <div class="qr-code">
        <img src="${ticket.qrCodeDataUrl}" alt="QR Code vé ${ticket.ticketNumber}" />
        <p style="margin-top: 10px; font-size: 12px; color: #6B7280;">
          Quét mã QR này tại cổng vào sự kiện
        </p>
      </div>
    </div>
    `
      )
      .join('')}

    <div class="note">
      <p><strong>Lưu ý quan trọng:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Vui lòng mang theo email này hoặc lưu mã QR trên điện thoại</li>
        <li>Mỗi mã QR chỉ được sử dụng một lần duy nhất</li>
        <li>Vui lòng đến trước giờ diễn ra sự kiện 15-30 phút để check-in</li>
        <li>Liên hệ với chúng tôi nếu có bất kỳ thắc mắc nào</li>
      </ul>
    </div>

    <div class="footer">
      <p>Chúng tôi rất mong được gặp bạn tại sự kiện!</p>
      <p style="margin-top: 20px; font-size: 12px;">
        Email này được gửi tự động, vui lòng không trả lời trực tiếp.<br>
        Nếu có câu hỏi, vui lòng liên hệ: support@orochi.vn
      </p>
    </div>
  </div>
</body>
</html>
  `
}
