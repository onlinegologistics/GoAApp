const dayjs = require('dayjs');

const generateTicketHTML = (booking, qrCodeDataURL) => {
    // Utility for date formatting
    const formatDate = (dateStr) => {
        try {
            return dayjs(dateStr).format('DD MMM YYYY, ddd');
        } catch (e) {
            return dateStr;
        }
    };

    const journeyDate = formatDate(booking.journeyDate);
    const bookingDate = formatDate(booking.createdAt);

    // Calculate duration (dummy calculation if exact times aren't available, assuming a common pattern or providing fallback)
    const duration = 'Route Duration'; // Ideally we'd get this from Route, but we can display a generic or known value if from DB
    
    // Status color logic (since it's a confirmed ticket usually if they can download it)
    const pnrStatus = booking.status === 'CONFIRMED' ? 'CONFIRMED' : booking.status;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GoAir E-Ticket - ${booking.pnr}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #d84e55;
                --primary-dark: #c13e44;
                --success: #10b981;
                --success-bg: #d1fae5;
                --text-main: #1e293b;
                --text-muted: #64748b;
                --bg-light: #f8fafc;
                --border-color: #e2e8f0;
            }
            body {
                font-family: 'Inter', sans-serif;
                background-color: #ffffff;
                margin: 0;
                padding: 16px;
                color: var(--text-main);
                -webkit-font-smoothing: antialiased;
            }
            .ticket-container {
                max-width: 800px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 12px;
                border: 1px solid var(--border-color);
                overflow: hidden;
            }
            /* Header */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 24px;
                background: linear-gradient(to right, #ffffff, var(--bg-light));
                border-bottom: 2px dashed var(--border-color);
            }
            .header-left {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .train-icon {
                width: 36px;
                height: 36px;
                background: #fee2e2;
                color: var(--primary);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .train-icon svg {
                width: 20px;
                height: 20px;
            }
            .brand-title {
                margin: 0;
                font-size: 20px;
                font-weight: 800;
                color: var(--text-main);
                letter-spacing: -0.5px;
            }
            .brand-subtitle {
                margin: 2px 0 0 0;
                font-size: 12px;
                color: var(--text-muted);
                font-weight: 500;
            }
            .status-badge {
                background: var(--success-bg);
                color: var(--success);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
                letter-spacing: 0.5px;
            }
            /* Main Content */
            .content {
                padding: 20px 24px;
            }
            /* PNR Section */
            .pnr-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }
            .pnr-box {
                background: var(--bg-light);
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 12px 20px;
                display: inline-block;
            }
            .pnr-label {
                font-size: 10px;
                text-transform: uppercase;
                color: var(--text-muted);
                font-weight: 700;
                letter-spacing: 1px;
                margin-bottom: 4px;
            }
            .pnr-number {
                font-size: 24px;
                font-weight: 800;
                color: var(--primary);
                margin: 0;
                line-height: 1;
            }
            .booking-id {
                font-size: 11px;
                color: var(--text-muted);
                margin-top: 6px;
                font-weight: 500;
            }
            .booking-date {
                text-align: right;
            }
            .booking-date .label {
                font-size: 11px;
                color: var(--text-muted);
                margin-bottom: 4px;
            }
            .booking-date .value {
                font-size: 13px;
                font-weight: 600;
            }
            
            /* Train Info & Timeline */
            .journey-card {
                background: #ffffff;
                border: 1px solid var(--border-color);
                border-radius: 12px;
                padding: 16px 20px;
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            .train-info-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border-color);
            }
            .train-name {
                font-size: 16px;
                font-weight: 700;
                margin: 0 0 2px 0;
                color: var(--text-main);
            }
            .train-number {
                font-size: 13px;
                color: var(--text-muted);
                font-weight: 600;
            }
            .class-badge {
                background: #f1f5f9;
                padding: 4px 10px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 700;
                color: var(--text-main);
                border: 1px solid var(--border-color);
            }
            .journey-date-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-main);
            }
            
            /* Timeline */
            .timeline {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                position: relative;
            }
            .station {
                flex: 1;
            }
            .station.dest {
                text-align: right;
            }
            .station-code {
                font-size: 20px;
                font-weight: 800;
                color: var(--text-main);
                margin-bottom: 2px;
            }
            .station-name {
                font-size: 12px;
                color: var(--text-muted);
                font-weight: 500;
            }
            .duration-center {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                padding-top: 6px;
            }
            .line-wrapper {
                width: 100%;
                display: flex;
                align-items: center;
                position: relative;
                margin-bottom: 0px;
            }
            .line {
                height: 2px;
                flex: 1;
                background: var(--border-color);
                position: relative;
            }
            .line::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 6px;
                height: 6px;
                background: white;
                border: 2px solid var(--border-color);
                border-radius: 50%;
            }
            .line.right::before {
                left: auto;
                right: 0;
            }
            .train-run-icon {
                color: var(--primary);
                padding: 0 10px;
                position: relative;
                z-index: 2;
                background: white;
                display: flex;
            }
            .train-run-icon svg {
                width: 16px;
                height: 16px;
            }
            
            /* Split Section Container */
            .split-container {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
            }
            .left-col {
                flex: 2;
            }
            .right-col {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            /* Passenger Table */
            .section-title {
                font-size: 14px;
                font-weight: 700;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                border-radius: 10px;
                overflow: hidden;
                border: 1px solid var(--border-color);
                page-break-inside: avoid;
            }
            th, td {
                padding: 10px 12px;
                text-align: left;
                font-size: 12px;
            }
            th {
                background-color: var(--primary);
                color: white;
                font-weight: 600;
                text-transform: uppercase;
                font-size: 10px;
                letter-spacing: 0.5px;
            }
            td {
                background-color: #ffffff;
                border-bottom: 1px solid var(--border-color);
                color: var(--text-main);
                font-weight: 500;
            }
            tr:last-child td {
                border-bottom: none;
            }
            .seat-info {
                font-weight: 700;
                color: var(--primary);
            }
            
            /* Payment & QR */
            .card-box {
                background: #ffffff;
                border: 1px solid var(--border-color);
                border-radius: 10px;
                padding: 16px;
                page-break-inside: avoid;
            }
            .qr-container {
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            .qr-container img {
                width: 90px;
                height: 90px;
                margin-bottom: 8px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
                padding: 4px;
            }
            .qr-label {
                font-size: 11px;
                color: var(--text-main);
                font-weight: 600;
            }
            .qr-desc {
                font-size: 9px;
                color: var(--text-muted);
                margin-top: 2px;
            }
            
            .payment-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                font-size: 12px;
            }
            .payment-row:last-child {
                margin-bottom: 0;
                padding-top: 10px;
                border-top: 1px dashed var(--border-color);
            }
            .payment-label {
                color: var(--text-muted);
            }
            .payment-val {
                font-weight: 600;
            }
            .total-val {
                font-size: 16px;
                font-weight: 800;
                color: var(--text-main);
            }

            /* Instructions */
            .instructions {
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 10px;
                padding: 16px;
                margin-bottom: 20px;
                page-break-inside: avoid;
            }
            .instructions-title {
                color: #d97706;
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .instructions ul {
                margin: 0;
                padding-left: 20px;
                color: #92400e;
                font-size: 12px;
                line-height: 1.5;
            }
            
            /* Footer */
            .footer {
                text-align: center;
                padding-top: 16px;
                border-top: 1px solid var(--border-color);
                page-break-inside: avoid;
            }
            .footer h3 {
                color: var(--primary);
                font-size: 18px;
                font-weight: 800;
                margin: 0 0 4px 0;
            }
            .footer p {
                font-size: 10px;
                color: var(--text-muted);
                margin: 0;
            }
        </style>
    </head>
    <body>
        <div class="ticket-container">
            <!-- Header -->
            <div class="header">
                <div class="header-left">
                    <div class="train-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><path d="m8 19-2 3"></path><path d="m18 22-2-3"></path><path d="M8 15h0"></path><path d="M16 15h0"></path></svg>
                    </div>
                    <div>
                        <h1 class="brand-title">GoAir E-Ticket</h1>
                        <p class="brand-subtitle">Booking Confirmed</p>
                    </div>
                </div>
                <div class="status-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    CONFIRMED
                </div>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- PNR Section -->
                <div class="pnr-section">
                    <div class="pnr-box">
                        <div class="pnr-label">PNR Number</div>
                        <h2 class="pnr-number">${booking.pnr}</h2>
                        <div class="booking-id">Booking ID: ${booking._id}</div>
                    </div>
                    <div class="booking-date">
                        <div class="label">Booking Date</div>
                        <div class="value">${bookingDate}</div>
                    </div>
                </div>

                <!-- Train Journey Details -->
                <div class="journey-card">
                    <div class="train-info-top">
                        <div>
                            <h3 class="train-name">${booking.train.name}</h3>
                            <div class="train-number">Train #${booking.train.number}</div>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div class="journey-date-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                ${journeyDate}
                            </div>
                            <div class="class-badge">${booking.passengers[0]?.coachType || 'General'}</div>
                        </div>
                    </div>

                    <div class="timeline">
                        <div class="station">
                            <div class="station-code">${booking.source.code}</div>
                            <div class="station-name">${booking.source.name}</div>
                        </div>
                        
                        <div class="duration-center">
                            <div class="line-wrapper">
                                <div class="line left"></div>
                                <div class="train-run-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                </div>
                                <div class="line right"></div>
                            </div>
                        </div>

                        <div class="station dest">
                            <div class="station-code">${booking.destination.code}</div>
                            <div class="station-name">${booking.destination.name}</div>
                        </div>
                    </div>
                </div>

                <!-- Two Column Layout -->
                <div class="split-container">
                    <!-- Left: Passengers -->
                    <div class="left-col">
                        <div class="section-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Passenger Details
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Coach</th>
                                    <th>Seat/Berth</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${booking.passengers.map((p, idx) => {
                                    const seatInfo = booking.allocatedSeats?.[idx] || {};
                                    return `
                                    <tr>
                                        <td>${idx + 1}</td>
                                        <td style="font-weight: 600;">${p.name}</td>
                                        <td>${p.age}</td>
                                        <td>${p.gender}</td>
                                        <td class="seat-info">${seatInfo.coachNumber || '-'}</td>
                                        <td class="seat-info">${seatInfo.seatNumber ? seatInfo.seatNumber + ' (' + (seatInfo.berthType||'') + ')' : '-'}</td>
                                        <td style="color: var(--success); font-weight: 700;">${pnrStatus}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Right: QR & Payment -->
                    <div class="right-col">
                        <div class="card-box qr-container">
                            <img src="${qrCodeDataURL}" alt="QR Code" />
                            <div class="qr-label">Scan to Verify</div>
                            <div class="qr-desc">Ticket Details Encrypted</div>
                        </div>

                        <div class="card-box">
                            <div class="section-title" style="margin-bottom: 12px; font-size: 14px;">Payment Summary</div>
                            <div class="payment-row">
                                <span class="payment-label">Base Fare</span>
                                <span class="payment-val">₹${Math.round(booking.totalFare * 0.9)}</span>
                            </div>
                            <div class="payment-row">
                                <span class="payment-label">Taxes & Fees</span>
                                <span class="payment-val">₹${Math.round(booking.totalFare * 0.1)}</span>
                            </div>
                            <div class="payment-row">
                                <span class="payment-label">Mode</span>
                                <span class="payment-val uppercase">Online</span>
                            </div>
                            <div class="payment-row">
                                <span class="payment-label" style="color: var(--text-main); font-weight: 700;">Total Amount</span>
                                <span class="total-val">₹${booking.totalFare}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Instructions -->
                <div class="instructions">
                    <div class="instructions-title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Important Information
                    </div>
                    <ul>
                        <li>Please reach the station at least 30 minutes before the scheduled departure.</li>
                        <li>Carry a valid Original ID Proof (Aadhar, Voter ID, Passport, etc.) along with this E-Ticket.</li>
                        <li>In case of train cancellation, full refund will be initiated automatically.</li>
                        <li>This ticket is non-transferable and valid only for the specified journey.</li>
                    </ul>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <h3>Happy Journey!</h3>
                    <p>This is a computer-generated ticket and does not require a physical signature.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { generateTicketHTML };
