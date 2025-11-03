'use server'

import { createClient } from '@/lib/supabase/server'
import { generateVietQRUrl, getVietQRConfig, generatePaymentDescription } from '@/lib/vietqr'
import QRCode from 'qrcode'
import { sendEmail, generateTicketEmailHtml, type TicketEmailData } from '@/lib/email'

export type CheckoutItem = {
  ticketTypeId: string
  ticketTypeName: string
  price: number
  quantity: number
  pointsEarned: number
}

export type CreateOrderInput = {
  eventId: string
  items: CheckoutItem[]
  customerName: string
  customerEmail: string
  customerPhone: string
  userId?: string
}

export type CreateOrderResult = {
  success: boolean
  orderId?: string
  orderNumber?: string
  qrCodeUrl?: string
  transactionCode?: string
  error?: string
}

/**
 * Tạo đơn hàng mới với mã QR thanh toán VietQR
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    const supabase = await createClient()

    // 1. Validate event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, start_date, location_name, location_address')
      .eq('id', input.eventId)
      .single()

    if (eventError || !event) {
      return { success: false, error: 'Không tìm thấy sự kiện' }
    }

    // 2. Validate ticket types và kiểm tra số lượng còn lại
    const ticketTypeIds = input.items.map((item) => item.ticketTypeId)
    const { data: ticketTypes, error: ticketError } = await supabase
      .from('ticket_types')
      .select('*')
      .in('id', ticketTypeIds)

    if (ticketError || !ticketTypes || ticketTypes.length === 0) {
      return { success: false, error: 'Không tìm thấy loại vé' }
    }

    // Kiểm tra số lượng vé còn lại
    for (const item of input.items) {
      const ticketType = ticketTypes.find((tt) => tt.id === item.ticketTypeId)
      if (!ticketType) {
        return { success: false, error: `Không tìm thấy loại vé: ${item.ticketTypeName}` }
      }

      const availableQuantity = ticketType.quantity - ticketType.sold_count
      if (availableQuantity < item.quantity) {
        return {
          success: false,
          error: `Loại vé "${item.ticketTypeName}" chỉ còn ${availableQuantity} vé`
        }
      }
    }

    // 3. Tính toán tổng tiền
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const finalAmount = subtotal // TODO: Apply voucher discount if needed

    // 4. Gọi database function để tạo transaction code
    const { data: txCode, error: txCodeError } = await supabase.rpc('generate_transaction_code')

    if (txCodeError || !txCode) {
      return { success: false, error: 'Không thể tạo mã giao dịch' }
    }

    const transactionCode = txCode as string

    // 5. Tạo mã QR thanh toán VietQR
    const vietQRConfig = getVietQRConfig()
    const paymentDescription = generatePaymentDescription(transactionCode)
    const qrCodeUrl = generateVietQRUrl({
      amount: finalAmount,
      description: paymentDescription,
      config: vietQRConfig,
    })

    // 6. Tạo order với expires_at (15 phút)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Generate order_number manually (format: ORD-YYYYMMDD-XXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderNumber = `ORD-${dateStr}-${randomNum}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        event_id: input.eventId,
        user_id: input.userId || null,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        items: input.items,
        subtotal,
        discount_amount: 0,
        final_amount: finalAmount,
        payment_method: 'vietqr',
        payment_status: 'pending',
        order_status: 'pending',
        transaction_code: transactionCode,
        payment_qr_code: qrCodeUrl,
        payment_bank_account: vietQRConfig.accountNo,
        payment_bank_name: vietQRConfig.accountName,
        payment_expires_at: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id, order_number')
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return { success: false, error: 'Không thể tạo đơn hàng' }
    }

    // 7. Cập nhật sold_count cho các ticket types
    for (const item of input.items) {
      await supabase.rpc('increment_ticket_sold_count', {
        ticket_type_id: item.ticketTypeId,
        increment_by: item.quantity,
      })
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      qrCodeUrl,
      transactionCode,
    }
  } catch (error) {
    console.error('Error in createOrder:', error)
    return { success: false, error: 'Đã xảy ra lỗi khi tạo đơn hàng' }
  }
}

export type ConfirmOrderPaymentInput = {
  orderId: string
  adminId: string
  verificationNote?: string
  bankTransactionId?: string
  bankTransactionAmount?: number
  bankTransactionDate?: string
}

export type ConfirmOrderPaymentResult = {
  success: boolean
  ticketsSent?: boolean
  error?: string
}

/**
 * Admin xác nhận thanh toán và gửi vé cho khách hàng
 */
export async function confirmOrderPayment(
  input: ConfirmOrderPaymentInput
): Promise<ConfirmOrderPaymentResult> {
  try {
    const supabase = await createClient()

    // 1. Lấy thông tin order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        event:events(
          id,
          title,
          start_date,
          location_name,
          location_address
        )
      `
      )
      .eq('id', input.orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Không tìm thấy đơn hàng' }
    }

    if (order.payment_status === 'paid') {
      return { success: false, error: 'Đơn hàng đã được xác nhận thanh toán' }
    }

    // 2. Cập nhật order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'confirmed',
        paid_at: new Date().toISOString(),
        confirmed_by: input.adminId,
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', input.orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return { success: false, error: 'Không thể cập nhật đơn hàng' }
    }

    // 3. Tạo payment verification record
    await supabase.from('payment_verifications').insert({
      order_id: input.orderId,
      verified_by: input.adminId,
      verification_method: 'manual',
      bank_transaction_id: input.bankTransactionId,
      bank_transaction_amount: input.bankTransactionAmount,
      bank_transaction_date: input.bankTransactionDate
        ? new Date(input.bankTransactionDate).toISOString()
        : null,
      is_verified: true,
      verification_note: input.verificationNote,
    })

    // 4. Tạo tickets cho từng item trong order
    const tickets: any[] = []
    const orderItems = order.items as CheckoutItem[]

    console.log(`Creating tickets for ${orderItems.length} items:`, orderItems)

    for (const item of orderItems) {
      console.log(`Processing item: ${item.ticketTypeName}, quantity: ${item.quantity}`)

      for (let i = 0; i < item.quantity; i++) {
        console.log(`Creating ticket ${i + 1}/${item.quantity} for ${item.ticketTypeName}`)

        const { data: ticket, error: ticketError } = await supabase
          .from('tickets')
          .insert({
            order_id: order.id,
            event_id: order.event_id,
            ticket_type_id: item.ticketTypeId,
            ticket_type_name: item.ticketTypeName,
            price: item.price,
            holder_name: order.customer_name,
            holder_email: order.customer_email,
            status: 'valid',
            qr_code: '', // Sẽ cập nhật sau
          })
          .select('id, ticket_number')
          .single()

        if (ticketError || !ticket) {
          console.error(`Error creating ticket ${i + 1}:`, ticketError)
          continue
        }

        console.log(`Ticket created: ${ticket.ticket_number}`)

        // Tạo QR code cho ticket (sử dụng ticket_number)
        // Convert to buffer instead of data URL
        const qrCodeBuffer = await QRCode.toBuffer(ticket.ticket_number, {
          width: 300,
          margin: 2,
          type: 'png',
        })

        // Upload QR code to Supabase Storage
        const qrFileName = `${ticket.ticket_number}.png`
        const { error: uploadError } = await supabase.storage
          .from('ticket-qr-codes')
          .upload(qrFileName, qrCodeBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: true, // Overwrite if exists
          })

        if (uploadError) {
          console.error(`Error uploading QR code for ${ticket.ticket_number}:`, uploadError)
          // Don't skip - still add ticket with empty QR, can regenerate later
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('ticket-qr-codes').getPublicUrl(qrFileName)

        console.log(`QR code URL: ${publicUrl}`)

        // Cập nhật QR code URL vào ticket
        await supabase
          .from('tickets')
          .update({ qr_code: publicUrl })
          .eq('id', ticket.id)

        tickets.push({
          ...ticket,
          ticketTypeName: item.ticketTypeName,
          holderName: order.customer_name,
          qrCodeDataUrl: publicUrl, // Use public URL instead of base64
        })
      }
    }

    console.log(`Total tickets created: ${tickets.length}`, tickets.map(t => t.ticket_number))

    // 5. Cộng điểm cho user (nếu có)
    // Chỉ insert vào point_transactions, trigger sẽ tự động update profiles
    if (order.user_id) {
      const totalPoints = orderItems.reduce(
        (sum, item) => sum + item.pointsEarned * item.quantity,
        0
      )

      if (totalPoints > 0) {
        const { error: pointError } = await supabase.from('point_transactions').insert({
          user_id: order.user_id,
          type: 'earn',
          points: totalPoints,
          balance_after: 0, // Trigger sẽ tự động update giá trị đúng
          reason: `Mua vé sự kiện: ${order.event.title}`,
          reference_type: 'order',
          reference_id: order.id,
        })

        if (pointError) {
          console.error('Error adding points:', pointError)
        }
      }
    }

    // 6. Gửi email vé cho khách hàng
    try {
      const emailData: TicketEmailData = {
        customerName: order.customer_name,
        eventTitle: order.event.title,
        eventDate: new Date(order.event.start_date).toLocaleString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        eventLocation: order.event.location_name || 'Đang cập nhật',
        tickets: tickets.map((t) => ({
          ticketNumber: t.ticket_number,
          ticketTypeName: t.ticketTypeName,
          holderName: t.holderName,
          qrCodeDataUrl: t.qrCodeDataUrl,
        })),
        orderNumber: order.order_number,
        totalAmount: order.final_amount,
      }

      const emailHtml = generateTicketEmailHtml(emailData)

      await sendEmail({
        to: order.customer_email,
        subject: `🎫 Vé sự kiện ${order.event.title} - ${order.order_number}`,
        html: emailHtml,
      })

      return { success: true, ticketsSent: true }
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Order đã được confirm thành công, chỉ việc gửi email thất bại
      return {
        success: true,
        ticketsSent: false,
        error: 'Đơn hàng đã được xác nhận nhưng gửi email thất bại',
      }
    }
  } catch (error) {
    console.error('Error in confirmOrderPayment:', error)
    return { success: false, error: 'Đã xảy ra lỗi khi xác nhận thanh toán' }
  }
}

/**
 * Lấy thông tin order by ID
 */
export async function getOrderById(orderId: string) {
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      event:events(
        id,
        title,
        slug,
        featured_image,
        start_date,
        location_name,
        location_address
      )
    `
    )
    .eq('id', orderId)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  // Nếu đã thanh toán, lấy thêm thông tin tickets
  if (order && order.payment_status === 'paid') {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, ticket_type_name, holder_name, status, qr_code')
      .eq('order_id', orderId)

    return { ...order, tickets: tickets || [] }
  }

  return { ...order, tickets: [] }
}

/**
 * Lấy danh sách orders (cho admin)
 */
export async function getOrders(filters?: {
  paymentStatus?: string
  orderStatus?: string
  limit?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      event:events(title)
    `
    )
    .order('created_at', { ascending: false })

  if (filters?.paymentStatus) {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters?.orderStatus) {
    query = query.eq('order_status', filters.orderStatus)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return data
}
