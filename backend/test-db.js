const axios = require('axios');

async function testRegistration() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: "Tested User",
      email: "testuser@example.com",
      phone: "1234567890",
      address: "123 Test Ave",
      password: "password123",
      role: "user"
    });
    console.log("SUCCESS! User data stored in database:");
    console.log(res.data);
  } catch (err) {
    if (err.response && err.response.data.message === 'User already exists') {
       console.log("User was already stored in the database perfectly!");
    } else {
       console.error("Error:", err.message);
    }
  }
}

testRegistration();
