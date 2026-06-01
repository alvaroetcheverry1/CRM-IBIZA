import exportImages from 'pdf-export-images';

async function test() {
  const images = await exportImages('../dummy.pdf', '.');
  console.log("Extracted images:", images);
}
test();
