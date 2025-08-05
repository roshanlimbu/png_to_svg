import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { PngToSvgConverter } from './converter.js';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for frontend communication
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://pngtosvg.com',
      'http://pngtosvg.com',
      'https://api.pngtosvg.com',
      'http://api.pngtosvg.com',
    ], // Local development and production domains
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only PNG files are allowed'), false);
    }
  },
});

const converter = new PngToSvgConverter();

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.json({ status: 'OK', message: 'PNG to SVG API is running' });
});

// Get available presets
app.get('/api/presets', (req: any, res: any) => {
  const presets = {
    logo: PngToSvgConverter.getPresetOptions('logo'),
    photo: PngToSvgConverter.getPresetOptions('photo'),
    drawing: PngToSvgConverter.getPresetOptions('drawing'),
    text: PngToSvgConverter.getPresetOptions('text'),
  };
  res.json(presets);
});

// Convert PNG to SVG endpoint
app.post('/api/convert', upload.single('image'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Parse options from request body
    const options: any = {};
    if (req.body.preset) {
      Object.assign(
        options,
        PngToSvgConverter.getPresetOptions(req.body.preset)
      );
    }

    // Override with custom options
    if (req.body.threshold) options.threshold = parseInt(req.body.threshold);
    if (req.body.turdSize) options.turdSize = parseInt(req.body.turdSize);
    if (req.body.optCurve !== undefined)
      options.optCurve = req.body.optCurve === 'true';
    if (req.body.turnPolicy) options.turnPolicy = req.body.turnPolicy;

    console.log('Converting image with options:', options);

    // Convert buffer to SVG
    const svgString = await converter.convertBuffer(req.file.buffer, options);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgString);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Failed to convert image',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Posterized conversion endpoint
app.post(
  '/api/posterize',
  upload.single('image'),
  async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const steps = parseInt(req.body.steps) || 4;

      // For posterized, we need to save to a temp file first
      const tempPath = `/tmp/temp_${Date.now()}.png`;
      const outputPath = `/tmp/output_${Date.now()}.svg`;

      await require('fs').promises.writeFile(tempPath, req.file.buffer);
      await converter.convertToPosterized(tempPath, outputPath, steps);

      const svgString = await require('fs').promises.readFile(
        outputPath,
        'utf-8'
      );

      // Cleanup temp files
      await require('fs').promises.unlink(tempPath);
      await require('fs').promises.unlink(outputPath);

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svgString);
    } catch (error) {
      console.error('Posterized conversion error:', error);
      res.status(500).json({
        error: 'Failed to convert image',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Bulk conversion endpoint
app.post(
  '/api/bulk-convert',
  upload.array('images', 20),
  async (req: any, res: any) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No image files provided' });
      }

      console.log(`Converting ${files.length} images in bulk...`);

      // Parse options from request body
      const options: any = {};
      if (req.body.preset) {
        Object.assign(
          options,
          PngToSvgConverter.getPresetOptions(req.body.preset)
        );
      }

      // Override with custom options
      if (req.body.threshold) options.threshold = parseInt(req.body.threshold);
      if (req.body.turdSize) options.turdSize = parseInt(req.body.turdSize);
      if (req.body.optCurve !== undefined)
        options.optCurve = req.body.optCurve === 'true';
      if (req.body.turnPolicy) options.turnPolicy = req.body.turnPolicy;

      const results = [];
      let successful = 0;
      let failed = 0;

      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filename = file.originalname || `image_${i + 1}.png`;

        try {
          console.log(`Converting ${filename}...`);
          const svgString = await converter.convertBuffer(file.buffer, options);

          results.push({
            filename: filename,
            svgFilename: filename.replace(/\.png$/i, '.svg'),
            success: true,
            svg: svgString,
            size: svgString.length,
          });

          successful++;
        } catch (error) {
          console.error(`Failed to convert ${filename}:`, error);

          results.push({
            filename: filename,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          failed++;
        }
      }

      // Return results as JSON with embedded SVGs
      res.json({
        summary: {
          total: files.length,
          successful,
          failed,
          processing_time: new Date().toISOString(),
        },
        results,
      });
    } catch (error) {
      console.error('Bulk conversion error:', error);
      res.status(500).json({
        error: 'Failed to process bulk conversion',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// Error handling middleware
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File too large. Maximum size is 10MB.' });
    }

    if (error.message === 'Only PNG files are allowed') {
      return res.status(400).json({ error: 'Only PNG files are allowed' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(port, () => {
  console.log(`🚀 PNG to SVG API server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🎯 API endpoints:`);
  console.log(`   POST /api/convert - Convert PNG to SVG`);
  console.log(`   POST /api/posterize - Convert PNG to posterized SVG`);
  console.log(`   POST /api/bulk-convert - Convert multiple PNG files to SVG`);
  console.log(`   GET /api/presets - Get available presets`);
});

export default app;
