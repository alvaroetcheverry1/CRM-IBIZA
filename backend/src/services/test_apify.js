require('dotenv').config({ path: __dirname + '/../../.env' });

async function testApify() {
  const token = process.env.APIFY_API_TOKEN;
  console.log('Token exists:', !!token);
  if (!token) {
    console.log('No token in .env');
    return;
  }
  
  try {
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
testApify();
