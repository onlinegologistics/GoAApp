const dayjs = require('dayjs'); // We'll make sure dayjs is available or just use native dates

function generateHotelInvoiceHTML(booking, qrCodeDataUrl) {
    const invoiceNo = `INV-${(booking.bookingId || booking._id.toString()).substring(0, 8).toUpperCase()}F`;
    const bookingIdFormatted = booking.bookingId || (booking._id ? `HTL-${booking._id.toString().substring(0,8).toUpperCase()}` : 'N/A');

    const bookingDate = new Date(booking.createdAt || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const checkIn = new Date(booking.checkInDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const checkOut = new Date(booking.checkOutDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Payment details
    const totalAmount = booking.totalPrice || 0;
    const taxes = booking.taxes || 0;
    const promoDiscount = booking.couponDiscount || 0;
    const baseFare = totalAmount - taxes + promoDiscount; // Rough approximation if base fare isn't explicitly separate
    
    // Hardcoded convenience fee based on screenshot or just 0
    const convenienceFee = 0; 
    
    // Split taxes roughly into CGST/SGST like the mockup
    const cgst = Math.round(taxes / 2);
    const sgst = taxes - cgst;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: 'Inter', sans-serif;
            }

            body {
                background-color: #fff;
                color: #212529;
                padding: 40px;
                width: 100%;
                max-width: 800px;
                margin: auto;
            }

            /* --- Header --- */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
            }

            .logo-section .logo-text {
                font-size: 28px;
                font-weight: 800;
                color: #006ce4;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .logo-section .subtitle {
                font-size: 11px;
                color: #555;
                margin-top: 4px;
                margin-left: 5px;
            }

            .invoice-title {
                text-align: right;
            }

            .invoice-title h1 {
                font-size: 26px;
                color: #1a1a1a;
                font-weight: 700;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .invoice-meta {
                text-align: right;
                font-size: 9.5px;
                color: #444;
                line-height: 1.6;
            }

            .company-info-bar {
                display: flex;
                align-items: center;
                font-size: 9px;
                color: #555;
                margin-top: 15px;
                gap: 15px;
            }
            .company-info-bar span {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* --- 2 Column Grid --- */
            .grid-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }

            .card {
                border: 1px solid #e0e8f0;
                border-radius: 12px;
                overflow: hidden;
            }

            .card-header {
                background-color: #f1f5fa;
                padding: 10px 16px;
                font-size: 13px;
                font-weight: 600;
                color: #0d3b66;
            }

            .card-body {
                padding: 16px;
            }

            /* Profile Lists */
            .profile-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .profile-item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 11px;
                color: #333;
            }
            .profile-icon {
                width: 20px;
                height: 20px;
                background-color: #e6f0fa;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #006ce4;
            }

            /* Key Value Table styling */
            .kv-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .kv-item {
                display: flex;
                font-size: 11px;
            }
            .kv-label {
                width: 100px;
                color: #666;
            }
            .kv-value {
                color: #222;
            }

            /* --- Main Split Data --- */
            .main-split {
                display: grid;
                grid-template-columns: 1.2fr 1fr;
                gap: 20px;
            }

            /* Hotel Info */
            .hotel-name {
                font-size: 18px;
                font-weight: 700;
                color: #000;
                margin-bottom: 6px;
            }
            .hotel-address {
                font-size: 10.5px;
                line-height: 1.5;
                color: #555;
                margin-bottom: 20px;
            }

            .room-info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            .info-block span {
                display: block;
                font-size: 11px;
                font-weight: 600;
                color: #111;
                margin-bottom: 4px;
            }
            .info-block p {
                font-size: 11px;
                color: #444;
                line-height: 1.4;
            }

            /* Support Footer */
            .support-call {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #333;
                margin-top: 30px;
            }

            /* Payment Summary Right Side */
            .payment-summary {
                border-left: 1px solid #eee;
                padding-left: 20px;
            }

            .payment-header {
                font-size: 13px;
                font-weight: 600;
                color: #000;
                margin-bottom: 15px;
            }

            .payment-row {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                margin-bottom: 10px;
                color: #444;
            }
            .payment-row.discount {
                color: #555;
            }
            .payment-row.discount .val {
                color: #d9381e;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px dashed #ccc;
                font-size: 13px;
                font-weight: 700;
                color: #000;
            }
            .total-row .val {
                color: #1a7b48;
                font-size: 16px;
            }
            
            .payment-method-row {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #444;
                margin-top: 15px;
            }
            
            /* Banner inside hotel details */
            .paid-banner {
                float: right;
                background-color: #2b7d57;
                color: #fff;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-top:-35px;
            }

            /* QR & Signature */
            .qr-signature-box {
                margin-top: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .qr-code {
                width: 100px;
                height: 100px;
                border: 1px solid #eee;
                border-radius: 8px;
                padding: 4px;
            }
            .qr-label {
                font-size: 9px;
                color: #777;
                margin-top: 6px;
                margin-bottom: 15px;
            }
            
            .signature {
                position: relative;
                width: 100%;
                text-align: center;
            }
            .signature-text {
                font-family: 'Brush Script MT', cursive;
                font-size: 24px;
                color: #006ce4;
                opacity: 0.7;
            }
            .stamp {
                position: absolute;
                top: -5px;
                right: 20%;
                border: 2px solid #2b7d57;
                color: #2b7d57;
                font-size: 12px;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 4px;
                transform: rotate(-10deg);
                background: rgba(255,255,255,0.8);
            }
            
            .auth-label {
                font-size: 9px;
                color: #888;
                margin-top: 5px;
            }

            /* Footer */
            .tax-footer {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                font-size: 8px;
                color: #666;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
            }

            .tax-table {
                width: 100%;
                border-collapse: collapse;
            }
            .tax-table td {
                padding: 2px 0;
            }

            .disclaimer {
                font-size: 9px;
                color: #888;
                margin-top: 30px;
                text-align: left;
                line-height: 1.4;
            }

            .footer-links {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
                font-size: 10px;
                color: #006ce4;
            }
            .footer-links span {
                cursor: pointer;
            }
            .footer-links span:not(:last-child)::after {
                content: '|';
                margin-left: 15px;
                color: #ccc;
            }

        </style>
    </head>
    <body>

        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <div class="logo-text">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2 22L12 2L22 22H2Z" fill="#006ce4"/>
                        <path d="M7 16H17L12 6L7 16Z" fill="#fff"/>
                        <path d="M4 12H20" stroke="#004b8d" stroke-width="2"/>
                    </svg>
                    GOAIRCLASS
                </div>
                <div class="subtitle">India's Smart Travel Partner</div>
                <div class="company-info-bar">
                    <span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> 
                        www.goairclass.com
                    </span>
                    <span>GSTIN: 23AAECD11234F1Z6</span>
                </div>
            </div>

            <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-meta">
                    <p>Invoice No: <strong>${invoiceNo}</strong></p>
                    <p>Booking ID: <strong>${bookingIdFormatted}</strong></p>
                    <p>Date: &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;<strong>${bookingDate}</strong></p>
                </div>
            </div>
        </div>

        <!-- Demographics Grid -->
        <div class="grid-2">
            <!-- Customer Details -->
            <div class="card">
                <div class="card-header">Customer Details</div>
                <div class="card-body">
                    <div class="profile-list">
                        <div class="profile-item">
                            <div class="profile-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <span style="font-weight: 500;">${booking.guestName}</span>
                        </div>
                        <div class="profile-item">
                            <div class="profile-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </div>
                            <span>${booking.guestPhone}</span>
                        </div>
                        <div class="profile-item">
                            <div class="profile-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </div>
                            <span>${booking.guestEmail}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Booking Details -->
            <div class="card">
                <div class="card-header">Booking Details</div>
                <div class="card-body">
                    <div class="kv-list">
                        <div class="kv-item">
                            <span class="kv-label">Booking ID:</span>
                            <span class="kv-value">${bookingIdFormatted}</span>
                        </div>
                        <div class="kv-item">
                            <span class="kv-label">Payment ID:</span>
                            <span class="kv-value">${booking.razorpayPaymentId || 'N/A'}</span>
                        </div>
                        <div class="kv-item">
                            <span class="kv-label">Booking Date:</span>
                            <span class="kv-value">${bookingDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Body Grid -->
        <div class="card">
            <div class="card-header" style="background-color: #f1f5fa; display: flex; justify-content: space-between;">
                <span>Hotel Details</span>
                <span style="font-size:13px; margin-right:50px;">Payment Summary</span>
            </div>
            <div class="card-body" style="padding: 20px 20px 0 20px;">
                <div class="main-split">
                    <!-- Left: Hotel Info -->
                    <div>
                        <h2 class="hotel-name">${booking.hotelId?.hotelName || 'Hotel'}</h2>
                        <p class="hotel-address">
                            ${booking.hotelId?.address || ''}, ${booking.hotelId?.city || ''}<br/>
                            ${booking.pincode || ''}
                        </p>

                        <div class="room-info-grid">
                            <div class="info-block">
                                <span>Check-in</span>
                                <p>${checkIn}</p>
                            </div>
                            <div class="info-block">
                                <span>Check-out</span>
                                <p>${checkOut}</p>
                            </div>
                            <div class="info-block">
                                <span>Room Info</span>
                                <p>${booking.roomType || 'Standard Room'}<br/>${booking.guests} Guest(s)</p>
                            </div>
                        </div>

                        <div class="support-call" style="margin-top: 40px; margin-bottom: 20px;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#006ce4" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            For support, call +91 91234567890
                        </div>
                    </div>

                    <!-- Right: Payment Summary -->
                    <div class="payment-summary">
                        ${booking.paymentStatus === 'Completed' || booking.status === 'confirmed' ? 
                            '<div class="paid-banner">PAID <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>' : ''}
                        
                        <div class="payment-row">
                            <span>Base Fare</span>
                            <span>INR ${baseFare}</span>
                        </div>
                        ${promoDiscount > 0 ? `
                        <div class="payment-row discount">
                            <span>Promo Discount</span>
                            <span class="val">-INR ${promoDiscount}</span>
                        </div>
                        ` : ''}
                        <div class="payment-row">
                            <span>Convenience Fee</span>
                            <span>INR ${convenienceFee}</span>
                        </div>
                        <div class="payment-row">
                            <span>CGST (9%)</span>
                            <span>INR ${cgst}</span>
                        </div>
                        <div class="payment-row">
                            <span>SGST (9%)</span>
                            <span>INR ${sgst}</span>
                        </div>

                        <div class="total-row">
                            <span>Total Amount Paid</span>
                            <span class="val">INR ${totalAmount}</span>
                        </div>

                        <div class="payment-method-row">
                            <span>Payment Method:</span>
                            <span style="font-weight: 600; color:#000;">${booking.razorpayPaymentId ? 'Razorpay' : 'Wallet/Cards'}</span>
                        </div>

                        <div class="qr-signature-box">
                            <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />
                            <div class="qr-label">Scan to verify your booking</div>
                            
                            <div class="signature">
                                <div class="signature-text">GoAirClass</div>
                                ${booking.paymentStatus === 'Completed' || booking.status === 'confirmed' ? 
                                    '<div class="stamp">PAID</div>' : ''}
                                <div class="auth-label">Authorized Signature</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="disclaimer">
            This is a computer-generated document. No signature is required.<br/>
            Please review the terms and conditions on our website for refund and cancellation policies.
        </div>

        <div class="footer-links">
            <span>Terms & Conditions</span>
            <span>Cancellation Policy</span>
            <span>Refund Policy</span>
            <span>Contact Policy</span>
        </div>

    </body>
    </html>
    `;
}

module.exports = { generateHotelInvoiceHTML };
