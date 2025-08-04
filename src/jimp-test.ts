// Simple test to check Jimp API
import { Jimp } from 'jimp';

async function testJimp() {
  try {
    console.log('Jimp object:', typeof Jimp);
    console.log('Jimp.read:', typeof Jimp.read);
    console.log('Available methods:', Object.getOwnPropertyNames(Jimp));

    // Try different ways to create/read
    const img = new Jimp({ width: 10, height: 10, color: 0x000000ff });
    console.log(
      'Created test image:',
      img.bitmap.width,
      'x',
      img.bitmap.height
    );
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testJimp();
