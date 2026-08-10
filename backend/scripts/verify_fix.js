const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'GoAirClass_2026_Admin_Secure_Secret_Key';
const BASE_URL = 'http://localhost:5000/api/coupons/operator/list';

function generateToken(role) {
    return jwt.sign(
        { id: '65f0a1234567890abcdef000', role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function request(url, token) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    body: body
                });
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function verify() {
    console.log('--- Verifying Coupon Role Fix ---');

    console.log('\nTesting with role: bus_operator');
    const token1 = generateToken('bus_operator');
    const res1 = await request(BASE_URL, token1);
    console.log('Status:', res1.status);
    console.log('Response:', res1.body.substring(0, 100));

    console.log('\nTesting with role: operator');
    const token2 = generateToken('operator');
    const res2 = await request(BASE_URL, token2);
    console.log('Status:', res2.status);
    console.log('Response:', res2.body.substring(0, 100));

    if (res1.status === 200 && res2.status === 200) {
        console.log('\nSUCCESS: Both roles are accepted!');
    } else {
        console.log('\nFAILURE: One or both roles returned error status.');
    }
}

verify().catch(console.error);
