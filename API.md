# API Documentation

## PNG to SVG Converter API

The PNG to SVG Converter provides a REST API for converting PNG images to SVG format.

### Base URL

```
http://localhost:3001
```

### Endpoints

#### Health Check

```http
GET /health
```

Returns the API status.

**Response:**

```json
{
  "status": "OK",
  "message": "PNG to SVG API is running"
}
```

#### Get Available Presets

```http
GET /api/presets
```

Returns all available conversion presets with their default options.

**Response:**

```json
{
  "logo": { "threshold": 128, "turdSize": 2, ... },
  "photo": { "threshold": 120, "turdSize": 4, ... },
  "drawing": { "threshold": 140, "turdSize": 1, ... },
  "text": { "threshold": 128, "turdSize": 1, ... }
}
```

#### Convert PNG to SVG

```http
POST /api/convert
```

Converts a PNG image to SVG format.

**Request:**

- Content-Type: `multipart/form-data`
- Body:
  - `image` (file): PNG image file
  - `preset` (string, optional): Preset name ('logo', 'photo', 'drawing', 'text')
  - `threshold` (number, optional): Black/white threshold (0-255)
  - `turdSize` (number, optional): Noise removal size
  - `optCurve` (boolean, optional): Enable curve optimization
  - `turnPolicy` (string, optional): Path direction policy

**Example using curl:**

```bash
curl -X POST http://localhost:3001/api/convert \
  -F "image=@example.png" \
  -F "preset=logo" \
  -F "threshold=140"
```

**Response:**

- Content-Type: `image/svg+xml`
- Body: SVG content as text

#### Convert PNG to Posterized SVG

```http
POST /api/posterize
```

Converts a PNG image to a multi-level posterized SVG.

**Request:**

- Content-Type: `multipart/form-data`
- Body:
  - `image` (file): PNG image file
  - `steps` (number, optional): Number of posterization levels (default: 4)

**Example using curl:**

```bash
curl -X POST http://localhost:3001/api/posterize \
  -F "image=@example.png" \
  -F "steps=6"
```

**Response:**

- Content-Type: `image/svg+xml`
- Body: Posterized SVG content as text

### Error Responses

All endpoints may return error responses with the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

Common error status codes:

- `400`: Bad Request (invalid file, missing parameters)
- `500`: Internal Server Error (conversion failed)

### Example JavaScript Usage

```javascript
// Convert PNG to SVG using fetch
async function convertPngToSvg(file, options = {}) {
  const formData = new FormData();
  formData.append('image', file);

  // Add options
  if (options.preset) formData.append('preset', options.preset);
  if (options.threshold)
    formData.append('threshold', options.threshold.toString());

  const response = await fetch('http://localhost:3001/api/convert', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.text(); // SVG content
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

convertPngToSvg(file, { preset: 'logo', threshold: 140 })
  .then((svgContent) => {
    console.log('Converted SVG:', svgContent);
  })
  .catch((error) => {
    console.error('Conversion failed:', error);
  });
```

### Frontend Integration

The project includes a React frontend that demonstrates how to use the API:

1. **File Upload**: Drag & drop or click to select PNG files
2. **Options Configuration**: Choose presets and adjust parameters
3. **Real-time Conversion**: Convert and preview SVG results
4. **Download**: Save the converted SVG file

The frontend is configured to proxy API requests automatically when running in development mode.
