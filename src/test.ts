import { PngToSvgConverter } from './converter.js';
import { Jimp } from 'jimp';
import * as fs from 'fs';

async function createTestImage() {
  console.log('🎨 Creating a test PNG image...');

  // Create a simple test image with Jimp
  const image = new Jimp({ width: 200, height: 100, color: 0xffffffff }); // White background

  // Draw some black shapes
  // Draw a rectangle
  for (let x = 20; x < 80; x++) {
    for (let y = 20; y < 60; y++) {
      image.setPixelColor(0x000000ff, x, y); // Black
    }
  }

  // Draw a circle
  const centerX = 140;
  const centerY = 50;
  const radius = 25;

  for (let x = centerX - radius; x <= centerX + radius; x++) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance <= radius) {
        image.setPixelColor(0x000000ff, x, y); // Black
      }
    }
  }

  // Save the test image
  await image.write('./examples/test-input.png');
  console.log('✅ Test PNG created: ./examples/test-input.png');

  return './examples/test-input.png';
}

async function testConversion() {
  try {
    // Create test image
    const inputPath = await createTestImage();

    // Test basic conversion
    console.log('\n🔄 Testing basic conversion...');
    const converter = new PngToSvgConverter();
    await converter.convertFile(inputPath, './examples/test-output-basic.svg');

    // Test with logo preset
    console.log('\n🔄 Testing logo preset...');
    const logoOptions = PngToSvgConverter.getPresetOptions('logo');
    await converter.convertFile(
      inputPath,
      './examples/test-output-logo.svg',
      logoOptions
    );

    // Test posterized
    console.log('\n🔄 Testing posterized conversion...');
    await converter.convertToPosterized(
      inputPath,
      './examples/test-output-posterized.svg',
      3
    );

    // Test custom options
    console.log('\n🔄 Testing custom options...');
    const customOptions = {
      threshold: 140,
      turdSize: 1,
      optCurve: true,
      optTolerance: 0.1,
      turnPolicy: 'minority' as const,
    };
    await converter.convertFile(
      inputPath,
      './examples/test-output-custom.svg',
      customOptions
    );

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📁 Generated files:');
    console.log('   • test-input.png (source)');
    console.log('   • test-output-basic.svg');
    console.log('   • test-output-logo.svg');
    console.log('   • test-output-posterized.svg');
    console.log('   • test-output-custom.svg');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testConversion();
}

export { testConversion };
