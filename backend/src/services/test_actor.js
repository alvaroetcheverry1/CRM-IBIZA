require('dotenv').config({ path: __dirname + '/../../.env' });
const { scraperService } = require('./scraperService');

async function testActor() {
  const jobId = await scraperService.startScrapingJob({
    plataforma: 'idealista',
    zona: 'Ibiza'
  });
  console.log('Job ID:', jobId);
  
  const checkInterval = setInterval(() => {
    const status = scraperService.getJobStatus(jobId);
    console.log('\n--- STATUS ---');
    console.log(status.status);
    console.log(status.logs.join('\n'));
    if (status.status !== 'RUNNING') {
      clearInterval(checkInterval);
    }
  }, 2000);
}
testActor();
