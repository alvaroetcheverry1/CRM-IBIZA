const { driveService } = require('./src/services/driveService');
const fs = require('fs');

async function test() {
  const file = {
    originalname: 'test_photo.jpg',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test data 123', 'utf8')
  };
  const result = await driveService.subirDocumento(file, null, 'FOTO');
  console.log("Result:", result);
  
  if (fs.existsSync('./public/uploads')) {
    console.log("Uploads contains:", fs.readdirSync('./public/uploads'));
  }
}
test();
