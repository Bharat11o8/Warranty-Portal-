"use strict";
async function testVendorRegistration() {
    const url = 'http://localhost:3000/api/auth/register';
    const data = {
        name: "Test Vendor",
        email: `vendor_${Date.now()}@example.com`,
        phoneNumber: "1234567890",
        role: "vendor",
        storeName: "Test Store",
        address: "123 Test St",
        state: "Test State",
        city: "Test City",
        pincode: "123456",
        manpower: [
            {
                name: "Worker 1",
                phoneNumber: "9876543210",
                manpowerId: "WOR1234",
                applicatorType: "seat_cover"
            }
        ]
    };
    try {
        console.log('Sending request to:', url);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        console.log('Registration Response:', result);
    }
    catch (error) {
        console.error('Registration Failed:', error);
    }
}
testVendorRegistration();
