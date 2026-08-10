const axios = require('axios');

async function testFareApi() {
    const baseUrl = 'http://localhost:5000/api/flights';
    const params = {
        from: 'DEL',
        to: 'PNQ',
        date: '2026-03-15'
    };

    console.log('--- Testing Flight Fares API ---');
    console.log(`Endpoint: ${baseUrl}/fares`);
    console.log(`Params:`, params);

    try {
        const response = await axios.get(`${baseUrl}/fares`, { params });
        console.log('Status:', response.status);
        console.log('Success:', response.data.success);
        console.log('Fares Found:', response.data.fares?.length);
        
        if (response.data.fares && response.data.fares.length > 0) {
            console.log('Sample Fare:', response.data.fares[0]);
            
            // Test Caching
            console.log('\n--- Testing Cache ---');
            const startTime = Date.now();
            const secondResponse = await axios.get(`${baseUrl}/fares`, { params });
            const endTime = Date.now();
            console.log('Second Request (Cached):', secondResponse.data.cached ? 'YES' : 'NO');
            console.log('Response Time:', endTime - startTime, 'ms');
        } else {
            console.log('No fares returned. Make sure you have flights in the database for these locations.');
        }

    } catch (error) {
        console.error('Test Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }
}

testFareApi();
