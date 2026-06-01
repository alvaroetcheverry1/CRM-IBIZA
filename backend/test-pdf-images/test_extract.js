const fs = require('fs');
const os = require('os');
const path = require('path');

async function run() {
  const { exportImages } = await import('pdf-export-images');
  // Just test behavior when passed a file
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-imgs-'));
  console.log("Will extract to", tmpDir);
  // Need a real PDF to test
}
run();
