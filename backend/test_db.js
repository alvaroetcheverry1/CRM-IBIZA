const { PrismaClient } = require('@prisma/client');
const regions = ['eu-west-2', 'eu-west-1', 'eu-central-1', 'eu-south-1', 'us-east-1', 'us-west-1'];

async function testConnection(url) {
  process.env.DATABASE_URL = url;
  const prisma = new PrismaClient({ log: ['error'] });
  try {
    await prisma.$connect();
    console.log("SUCCESS: " + url);
    return true;
  } catch (e) {
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const pw = 'Mividaloca1.';
  const pw2 = encodeURIComponent('Mividaloca1.');
  const proj = 'zbgrxbwvprrhtcsaejku';
  
  for (const reg of regions) {
     const url = `postgresql://postgres.${proj}:${pw}@aws-0-${reg}.pooler.supabase.com:6543/postgres?pgbouncer=true`; // Test 1
     if (await testConnection(url)) return;
     const url2 = `postgresql://postgres.${proj}:${pw2}@aws-0-${reg}.pooler.supabase.com:6543/postgres?pgbouncer=true`; // Test 2
     if (await testConnection(url2)) return;
  }
  console.log("ALL FAILED");
}
run();
