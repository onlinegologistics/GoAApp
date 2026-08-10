const nodemailer = require('nodemailer');

/**
 * Configure dynamic SMTP transporter
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: (process.env.SMTP_USER || '').trim(),
        pass: (process.env.SMTP_PASS || '').trim(),
    },
});

/**
 * Send OTP Email
 * @param {string} to - Recipient email
 * @param {string} otp - 6 digit OTP
 */
const sendOtpEmail = async (to, otp) => {
    try {
        const userEmail = (process.env.SMTP_USER || '').trim();
        const userPass = (process.env.SMTP_PASS || '').trim();

        if (!userEmail || !userPass) {
            console.log("\n--- [DEV MODE] EMAIL OTP WOULD BE SENT ---");
            console.log(`To: ${to}`);
            console.log(`Subject: Your OTP Code`);
            console.log(`Body: Hello,\n\nYour verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nDo not share this OTP with anyone.`);
            console.log("-------------------------------------------\n");
            return true;
        }

        const mailOptions = {
            from: `"GoAirClass" <${userEmail}>`,
            to: to,
            subject: 'Your OTP Code',
            text: `Hello,

Your verification OTP is: ${otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb; text-align: center;">GoAirClass Verification</h2>
                    <p style="font-size: 16px; color: #444;">Hello,</p>
                    <p style="font-size: 16px; color: #444;">Your verification OTP is:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 8px;">${otp}</span>
                    </div>
                    <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes.</p>
                    <p style="font-size: 14px; color: #e11d48; font-weight: bold;">Do not share this OTP with anyone.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #aaa; text-align: center;">
                        © 2026 GoAirClass. All rights reserved.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        if (process.env.NODE_ENV === 'development') {
            console.log("\n--- [DEV FALLBACK MODE] EMAIL SENDING FAILED (SMTP AUTH), PRINTING OTP ---");
            console.log(`To: ${to}`);
            console.log(`OTP Code: ${otp}`);
            console.log("-------------------------------------------------------------------------\n");
            return true;
        }
        return false;
    }
};

/**
 * Send Set Password Email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} role - Operator role (Bus/Hotel)
 * @param {string} link - Activation link
 */
const sendSetPasswordEmail = async (to, name, role, link) => {
    try {
        const userEmail = (process.env.SMTP_USER || '').trim();
        const userPass = (process.env.SMTP_PASS || '').trim();

        if (!userEmail || !userPass) {
            console.log("\n--- [DEV MODE] EMAIL WOULD BE SENT ---");
            console.log(`To: ${to}`);
            console.log(`Subject: Set Your Password - GoAirClass`);
            console.log(`Body: Hello ${name}, your account as a ${role} has been created. Set password here: ${link}`);
            console.log("---------------------------------------\n");
            return true;
        }

        const mailOptions = {
            from: `"GoAirClass Admin" <${userEmail}>`,
            to: to, // Dynamic email from form
            subject: 'Set Your Password - GoAirClass Operator Onboarding',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #2563eb;">Hello ${name},</h2>
                    <p style="font-size: 16px; color: #444;">
                        Your operator account has been created on the GoAirClass platform as a <strong>${role.replace('_', ' ').toUpperCase()}</strong>.
                    </p>
                    <p style="font-size: 16px; color: #444;">
                        Please click the button below to set your secure password and activate your account:
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${link}" style="background-color: #2563eb; color: white; padding: 15px 25px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            Set Your Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #888;">
                        This link will expire in 1 hour. If it expires, please contact the administrator for a new link.
                    </p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="font-size: 12px; color: #aaa; text-align: center;">
                        © 2026 GoAirClass Admin Panel. All rights reserved.
                    </p>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        if (process.env.NODE_ENV === 'development') {
            console.log("\n--- [DEV FALLBACK MODE] EMAIL SENDING FAILED (SMTP AUTH), PRINTING LINK ---");
            console.log(`To: ${to}`);
            console.log(`Activation Link: ${link}`);
            console.log("---------------------------------------------------------------------------\n");
            return true;
        }
        return false;
    }
};

module.exports = { sendSetPasswordEmail, sendOtpEmail };
