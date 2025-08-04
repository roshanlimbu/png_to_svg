# 🚀 Bulk Conversion Guide

The PNG to SVG converter supports multiple ways to convert images in bulk:

## 1. CLI Batch Processing (Simple)

Convert all PNG files in a directory:

```bash
# Basic batch conversion
npm run cli batch ./input-folder ./output-folder

# With preset
npm run cli batch ./input-folder ./output-folder --preset logo

# Example
npm run cli batch ./examples ./converted-svgs --preset logo
```

## 2. Advanced Bulk Converter (Powerful)

The enhanced bulk converter offers more features:

```bash
# Sequential conversion
npm run bulk ./input-folder ./output-folder --preset logo

# Parallel conversion (faster)
npm run bulk ./input-folder ./output-folder --preset logo --parallel

# Recursive (includes subdirectories)
npm run bulk ./input-folder ./output-folder --recursive --overwrite

# Filter by file size
npm run bulk ./input-folder ./output-folder --min-size 10 --max-size 1000

# Custom options
npm run bulk ./input-folder ./output-folder --threshold 140 --parallel --max-workers 8
```

### Advanced Options:

- `--preset <type>` - Use preset (logo|photo|drawing|text)
- `--threshold <num>` - Black/white threshold (0-255)
- `--parallel` - Enable parallel processing (faster)
- `--recursive` - Process subdirectories
- `--overwrite` - Overwrite existing files
- `--max-workers <num>` - Max parallel workers (default: 4)
- `--min-size <kb>` - Skip files smaller than X KB
- `--max-size <kb>` - Skip files larger than X KB

## 3. API Bulk Conversion

### Single File API:

```bash
curl -X POST http://localhost:3001/api/convert \
  -F "image=@example.png" \
  -F "preset=logo"
```

### Bulk API (Multiple Files):

```bash
curl -X POST http://localhost:3001/api/bulk-convert \
  -F "images=@image1.png" \
  -F "images=@image2.png" \
  -F "images=@image3.png" \
  -F "preset=logo"
```

### JavaScript/Frontend Bulk Upload:

```javascript
async function convertMultipleImages(files, options = {}) {
  const formData = new FormData();

  // Add all files
  files.forEach((file) => {
    formData.append('images', file);
  });

  // Add options
  if (options.preset) formData.append('preset', options.preset);
  if (options.threshold)
    formData.append('threshold', options.threshold.toString());

  const response = await fetch('/api/bulk-convert', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  console.log(
    `Converted ${result.summary.successful}/${result.summary.total} files`
  );

  // Download each SVG
  result.results.forEach((item) => {
    if (item.success) {
      downloadSvg(item.svg, item.svgFilename);
    }
  });
}

function downloadSvg(svgContent, filename) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

## 4. Programmatic Usage

```javascript
import { BulkConverter } from './dist/bulk-converter.js';

const bulkConverter = new BulkConverter();

await bulkConverter.convertDirectory('./input', './output', {
  preset: 'logo',
  parallel: true,
  recursive: true,
  overwrite: true,
  maxWorkers: 4,
  filterSize: { min: 1, max: 5000 }, // 1KB to 5MB
});
```

## Performance Tips

1. **Use parallel processing** for many files: `--parallel`
2. **Filter by size** to skip tiny or huge files: `--min-size 5 --max-size 2000`
3. **Use appropriate presets** for your image type
4. **Adjust worker count** based on your CPU: `--max-workers 8`

## Example Workflows

### Convert Logo Collection:

```bash
npm run bulk ./logos ./svg-logos --preset logo --parallel --overwrite
```

### Convert Photos (Large Collection):

```bash
npm run bulk ./photos ./svg-photos --preset photo --parallel --max-workers 6 --min-size 50
```

### Recursive Directory Processing:

```bash
npm run bulk ./project-assets ./svg-assets --recursive --preset drawing --overwrite
```

### API Bulk Upload in Web App:

1. User selects multiple PNG files
2. JavaScript sends them to `/api/bulk-convert`
3. Server returns array of SVG results
4. Client downloads each SVG automatically

The bulk converter handles errors gracefully and provides detailed progress reports!
