import { PngToSvgConverter } from './converter.js';
import * as path from 'path';

async function basicExample() {
  console.log('🚀 PNG to SVG Converter Examples\n');

  const converter = new PngToSvgConverter();

  // Example 1: Basic conversion
  console.log('📝 Example 1: Basic conversion');
  try {
    await converter.convertFile(
      './examples/input.png',
      './examples/output-basic.svg'
    );
  } catch (error) {
    console.log('⚠️  No input file found, creating example later...');
  }

  // Example 2: Custom options for logo
  console.log('\n📝 Example 2: Logo conversion with custom options');
  const logoOptions = PngToSvgConverter.getPresetOptions('logo');
  console.log('Logo preset options:', logoOptions);

  // Example 3: Custom options for photos
  console.log('\n📝 Example 3: Photo conversion');
  const photoOptions = {
    threshold: 120,
    turdSize: 4,
    optCurve: true,
    optTolerance: 0.3,
    turnPolicy: 'majority' as const,
  };
  console.log('Photo options:', photoOptions);

  // Example 4: Text-specific settings
  console.log('\n📝 Example 4: Text conversion');
  const textOptions = PngToSvgConverter.getPresetOptions('text');
  console.log('Text preset options:', textOptions);

  // Example 5: Buffer conversion
  console.log(
    '\n📝 Example 5: Buffer conversion (useful for web applications)'
  );
  console.log(`
// Convert from buffer (useful for web apps)
const pngBuffer = fs.readFileSync('input.png');
const svgString = await converter.convertBuffer(pngBuffer, options);
  `);

  // Example 6: Posterized conversion
  console.log('\n📝 Example 6: Posterized SVG (multi-level)');
  console.log(`
// Create posterized SVG with 4 color levels
await converter.convertToPosterized(
  'input.png', 
  'output-posterized.svg', 
  4  // number of steps
);
  `);
}

// Demo different settings
async function settingsDemo() {
  console.log('\n⚙️  Settings Explanation:\n');

  console.log('🎯 threshold (0-255): Controls black/white cutoff');
  console.log('   - Lower values = more black areas');
  console.log('   - Higher values = more white areas');
  console.log('   - Default: 128\n');

  console.log('🧹 turdSize: Remove noise/speckles up to this size');
  console.log('   - Larger values = cleaner output');
  console.log('   - Default: 2\n');

  console.log('📐 alphaMax: Corner threshold (smoothness)');
  console.log('   - Lower = more corners preserved');
  console.log('   - Higher = smoother curves');
  console.log('   - Default: 1\n');

  console.log('🎨 optCurve: Enable curve optimization');
  console.log('   - true = smoother, smaller SVG files');
  console.log('   - false = more angular, literal tracing');
  console.log('   - Default: true\n');

  console.log('🎯 turnPolicy: How to resolve path ambiguities');
  console.log('   - "minority": choose direction of fewer pixels');
  console.log('   - "majority": choose direction of more pixels');
  console.log('   - "black"/"white": prefer black/white pixels');
  console.log('   - Default: "minority"\n');
}

// Usage patterns
function usagePatterns() {
  console.log('\n📋 Common Usage Patterns:\n');

  console.log('1️⃣ Simple Logo Conversion:');
  console.log(`
const converter = new PngToSvgConverter();
const options = PngToSvgConverter.getPresetOptions('logo');
await converter.convertFile('logo.png', 'logo.svg', options);
  `);

  console.log('2️⃣ Batch Processing:');
  console.log(`
const files = ['logo1.png', 'logo2.png', 'icon.png'];
for (const file of files) {
  const output = file.replace('.png', '.svg');
  await converter.convertFile(file, output);
}
  `);

  console.log('3️⃣ Web API Integration:');
  console.log(`
app.post('/convert', async (req, res) => {
  const pngBuffer = req.file.buffer;
  const svgString = await converter.convertBuffer(pngBuffer);
  res.type('image/svg+xml').send(svgString);
});
  `);

  console.log('4️⃣ Fine-tuned Settings:');
  console.log(`
const customOptions = {
  threshold: 140,      // More white areas
  turdSize: 3,         // Remove small noise
  optCurve: true,      // Smooth curves
  optTolerance: 0.1,   // High precision
  turnPolicy: 'minority'
};
await converter.convertFile('input.png', 'output.svg', customOptions);
  `);
}

// Run examples
async function main() {
  await basicExample();
  await settingsDemo();
  usagePatterns();

  console.log('\n🎉 Ready to convert your PNG images to SVG!');
  console.log('\n💡 Tips:');
  console.log('   • Use "logo" preset for simple graphics');
  console.log('   • Use "photo" preset for complex images');
  console.log('   • Use "text" preset for text-heavy images');
  console.log('   • Adjust threshold for better black/white balance');
  console.log('   • Increase turdSize to remove noise');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
