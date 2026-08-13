const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:5001/api/flights/search', {
      from: 'PNQ',
      to: 'BOM',
      departDate: '2026-08-12',
      passengers: { adults: 1, children: 0, infants: 0 }
    });
    console.log('Success! Flights found:', res.data?.data?.flights?.length || res.data?.flights?.length || 0);
    console.log('Departure Code in Response:', res.data?.departureCode || res.data?.data?.departureCode);
    console.log('Arrival Code in Response:', res.data?.arrivalCode || res.data?.data?.arrivalCode);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
