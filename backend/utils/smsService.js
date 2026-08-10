/**
 * Service to send SMS via MSG91/Twilio.
 * In development, it mocks the API call.
 */

const sendOTP = async (mobileNumber, otp) => {
    try {
        // If we have actual keys in .env, we'd use them here.
        // Example: const apiKey = process.env.MSG91_API_KEY;

        console.log("-----------------------------------------");
        console.log(`[SMS MOCK] Sending OTP to ${mobileNumber}`);
        console.log(`[SMS MOCK] OTP Message: Your GoAirClass verification code is ${otp}. Valid for 5 minutes.`);
        console.log("-----------------------------------------");

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, message: "SMS sent successfully" };
    } catch (error) {
        console.error("Error sending SMS:", error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendOTP
};
