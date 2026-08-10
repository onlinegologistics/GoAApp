const axios = require('axios');

// CRM down ho to bhi user ka form kabhi fail nahi hona chahiye —
// isliye har error sirf log hota hai, throw kabhi nahi.
const syncLeadToCrm = async (payload) => {
  if (!process.env.CRM_API_URL || !process.env.CRM_API_KEY) return;
  try {
    await axios.post(process.env.CRM_API_URL, payload, {
      headers: { 'x-api-key': process.env.CRM_API_KEY },
      timeout: 5000,
    });
  } catch (err) {
    const detail = err.response
      ? `${err.response.status} ${JSON.stringify(err.response.data)}`
      : err.message;
    console.error('[CRM_SYNC_FAILED]', detail);
  }
};

module.exports = { syncLeadToCrm };
