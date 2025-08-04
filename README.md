# PNG to SVG Converter

A powerful Node.js library for converting PNG images to SVG using Potrace and Jimp. This tool performs bitmap tracing to create scalable vector graphics from raster images.

## 🚀 Features

- Convert PNG images to SVG format using advanced tracing algorithms
- Multiple conversion presets for different image types (logo, photo, drawing, text)
- Posterization support for multi-level SVG output
- Command-line interface for batch processing
- TypeScript support with full type definitions
- Customizable tracing parameters for fine-tuned results

## 📦 Installation

```bash
npm install
```

## 🛠️ How It Works

This converter uses a two-step process:

1. **Jimp**: Preprocesses the PNG image

   - Converts to grayscale
   - Applies contrast and normalization
   - Performs threshold-based binarization

2. **Potrace**: Traces the bitmap to create vector paths
   - Converts bitmap to mathematical curves
   - Optimizes paths for smoother output
   - Generates clean SVG markup

## 💻 Usage

### Programmatic API

```typescript
import { PngToSvgConverter } from './src/converter.js';

const converter = new PngToSvgConverter();

// Basic conversion
await converter.convertFile('input.png', 'output.svg');

// With custom options
const options = {
  threshold: 128, // Black/white cutoff (0-255)
  turdSize: 2, // Remove noise up to this size
  optCurve: true, // Enable curve optimization
  turnPolicy: 'minority', // Path direction preference
};

await converter.convertFile('input.png', 'output.svg', options);

// Using presets
const logoOptions = PngToSvgConverter.getPresetOptions('logo');
await converter.convertFile('logo.png', 'logo.svg', logoOptions);

// Convert from buffer (useful for web applications)
const pngBuffer = fs.readFileSync('input.png');
const svgString = await converter.convertBuffer(pngBuffer, options);

// Posterized SVG (multi-color levels)
await converter.convertToPosterized('input.png', 'output.svg', 4);
```

### Command Line Interface

```bash
# Build the project first
npm run build

# Basic conversion
node dist/cli.js convert input.png output.svg

# With options
node dist/cli.js convert input.png output.svg --threshold 140 --preset logo

# Posterized conversion
node dist/cli.js posterize input.png output.svg --steps 6

# Batch processing
node dist/cli.js batch ./input-folder ./output-folder --preset drawing
```

## ⚙️ Configuration Options

| Option         | Type    | Default    | Description                                                               |
| -------------- | ------- | ---------- | ------------------------------------------------------------------------- |
| `threshold`    | number  | 128        | Black/white threshold (0-255). Lower = more black areas                   |
| `turdSize`     | number  | 2          | Remove noise/speckles up to this size                                     |
| `alphaMax`     | number  | 1          | Corner threshold for smoothness                                           |
| `optCurve`     | boolean | true       | Enable curve optimization                                                 |
| `optTolerance` | number  | 0.2        | Curve optimization tolerance                                              |
| `turnPolicy`   | string  | 'minority' | Path direction: 'minority', 'majority', 'black', 'white', 'left', 'right' |
| `blackOnWhite` | boolean | true       | Color interpretation                                                      |

## 🎯 Presets

The library includes optimized presets for different image types:

### Logo (`'logo'`)

- `threshold: 128`
- `turdSize: 2`
- `optCurve: true`
- `optTolerance: 0.2`
- Best for: Simple graphics, logos, icons

### Photo (`'photo'`)

- `threshold: 120`
- `turdSize: 4`
- `optTolerance: 0.3`
- Best for: Complex photographic images

### Drawing (`'drawing'`)

- `threshold: 140`
- `turdSize: 1`
- `optTolerance: 0.1`
- Best for: Hand-drawn illustrations, sketches

### Text (`'text'`)

- `threshold: 128`
- `turdSize: 1`
- `optCurve: false`
- Best for: Text-heavy images, documents

## 🏃 Quick Start

1. **Run Examples**:

   ```bash
   npm run examples
   ```

2. **Try CLI**:

   ```bash
   npm run cli convert examples/sample.png examples/output.svg --preset logo
   ```

3. **Development**:
   ```bash
   npm run dev  # Watch mode
   ```

## 📁 Project Structure

```
src/
├── converter.ts    # Main conversion logic
├── cli.ts         # Command-line interface
├── examples.ts    # Usage examples and demos
└── index.ts       # Main entry point
```

## 🔧 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (development)
npm run dev

# Run examples
npm run examples
```

## 📋 Common Use Cases

### Web API Integration

```typescript
app.post('/convert', async (req, res) => {
  const pngBuffer = req.file.buffer;
  const svgString = await converter.convertBuffer(pngBuffer);
  res.type('image/svg+xml').send(svgString);
});
```

### Batch Processing

```typescript
const files = await fs.readdir('./images');
const pngFiles = files.filter((f) => f.endsWith('.png'));

for (const file of pngFiles) {
  const output = file.replace('.png', '.svg');
  await converter.convertFile(`./images/${file}`, `./svg/${output}`);
}
```

### Fine-tuned Conversion

```typescript
const customOptions = {
  threshold: 140, // More white areas
  turdSize: 3, // Remove small noise
  optCurve: true, // Smooth curves
  optTolerance: 0.1, // High precision
  turnPolicy: 'minority',
};
```

## 🎨 Tips for Best Results

- **Logos**: Use 'logo' preset with high contrast source images
- **Photos**: Use 'photo' preset and experiment with threshold values
- **Text**: Use 'text' preset with clean, high-resolution source
- **Noise**: Increase `turdSize` to remove unwanted small elements
- **Smoothness**: Adjust `optTolerance` for curve smoothness vs. accuracy

## 🚨 Troubleshooting

- **Low quality output**: Try adjusting `threshold` value
- **Too much noise**: Increase `turdSize` parameter
- **Blocky curves**: Enable `optCurve` and adjust `optTolerance`
- **Missing details**: Lower `turdSize` and `threshold`

## 📚 Dependencies

- **[Jimp](https://github.com/jimp-dev/jimp)**: Image processing and manipulation
- **[Potrace](https://github.com/tooolbox/node-potrace)**: Bitmap tracing to vector graphics
- **[Commander](https://github.com/tj/commander.js)**: Command-line interface

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Happy converting! 🎉**
