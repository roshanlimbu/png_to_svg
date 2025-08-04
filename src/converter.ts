import * as JimpLib from 'jimp';
import * as potrace from 'potrace';
import { promises as fs, unlinkSync } from 'fs';

const { Jimp } = JimpLib;

export interface ConversionOptions {
  threshold?: number; // Black/white threshold (0-255)
  turdSize?: number; // Suppress speckles of up to this size
  alphaMax?: number; // Corner threshold parameter
  optCurve?: boolean; // Curve optimization
  optTolerance?: number; // Curve optimization tolerance
  turnPolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority';
  blackOnWhite?: boolean; // Interpret colors
}

export class PngToSvgConverter {
  private defaultOptions: Required<ConversionOptions> = {
    threshold: 128,
    turdSize: 2,
    alphaMax: 1,
    optCurve: true,
    optTolerance: 0.2,
    turnPolicy: 'minority',
    blackOnWhite: true,
  };

  /**
   * Convert PNG file to SVG
   */
  async convertFile(
    inputPath: string,
    outputPath: string,
    options: ConversionOptions = {}
  ): Promise<void> {
    try {
      console.log(`🔄 Converting ${inputPath} to SVG...`);

      // First preprocess with Jimp
      const image = await Jimp.read(inputPath);
      const processedImage = image.greyscale().contrast(0.3).normalize();

      // Apply threshold if specified
      const opts = { ...this.defaultOptions, ...options };
      if (opts.threshold !== undefined) {
        processedImage.threshold({ max: opts.threshold });
      }

      // Save preprocessed image to temp file
      const tempPath = inputPath.replace('.png', `.temp_${Date.now()}.png`);
      await processedImage.write(tempPath as `${string}.${string}`);

      console.log(
        `📐 Image dimensions: ${processedImage.bitmap.width}x${processedImage.bitmap.height}`
      );

      // Use potrace with the temp file
      const svgContent = await new Promise<string>((resolve, reject) => {
        potrace.trace(tempPath, opts, (err: any, svg: string) => {
          // Clean up temp file
          unlinkSync(tempPath);

          if (err) {
            reject(err);
          } else {
            resolve(svg);
          }
        });
      });

      // Write to output file
      await fs.writeFile(outputPath, svgContent);

      console.log(`✅ Successfully converted to ${outputPath}`);
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      throw error;
    }
  }

  /**
   * Convert PNG buffer to SVG string
   */
  async convertBuffer(
    pngBuffer: Buffer,
    options: ConversionOptions = {}
  ): Promise<string> {
    try {
      const image = await Jimp.read(pngBuffer);
      return await this.convertImageToSvg(image, options);
    } catch (error) {
      console.error('❌ Buffer conversion failed:', error);
      throw error;
    }
  }

  /**
   * Core conversion logic
   */
  private async convertImageToSvg(
    image: any,
    options: ConversionOptions
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    // Preprocess image
    const processedImage = image.greyscale().contrast(0.3).normalize();

    // Apply threshold if specified
    if (opts.threshold !== undefined) {
      processedImage.threshold({ max: opts.threshold });
    }

    // Get image dimensions
    const width = processedImage.bitmap.width;
    const height = processedImage.bitmap.height;

    console.log(`📐 Image dimensions: ${width}x${height}`);

    // Save to temp file since potrace has issues with Jimp objects directly
    const tempPath = `/tmp/temp_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}.png`;
    await processedImage.write(tempPath as `${string}.${string}`);

    // Trace with potrace using the temp file
    return new Promise((resolve, reject) => {
      potrace.trace(tempPath, opts, (err: any, svg: string) => {
        // Clean up temp file
        try {
          unlinkSync(tempPath);
        } catch (cleanupErr) {
          console.warn('Warning: Could not clean up temp file:', tempPath);
        }

        if (err) {
          reject(err);
        } else {
          resolve(svg);
        }
      });
    });
  }

  /**
   * Convert Jimp image to bitmap buffer for potrace
   */
  private createBitmap(image: any): Buffer {
    const { width, height, data } = image.bitmap;

    // Calculate bitmap size (1 bit per pixel, padded to byte boundary)
    const bytesPerLine = Math.ceil(width / 8);
    const bitmapSize = bytesPerLine * height;
    const bitmap = Buffer.alloc(bitmapSize, 0);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4; // RGBA
        const r = data[pixelIndex];

        // Convert to black/white (0 = black, 1 = white)
        const isWhite = r > 127;

        if (isWhite) {
          const byteIndex = y * bytesPerLine + Math.floor(x / 8);
          const bitIndex = 7 - (x % 8);
          bitmap[byteIndex] |= 1 << bitIndex;
        }
      }
    }

    return bitmap;
  }

  /**
   * Create posterized SVG with multiple colors
   */
  async convertToPosterized(
    inputPath: string,
    outputPath: string,
    steps: number = 4,
    options: ConversionOptions = {}
  ): Promise<void> {
    try {
      console.log(`🎨 Creating posterized SVG with ${steps} steps...`);

      const image = await Jimp.read(inputPath);
      const processedImage = image.greyscale().normalize();

      // Apply threshold if specified
      if (options.threshold !== undefined) {
        processedImage.threshold({ max: options.threshold });
      }

      // Save to temp file for potrace
      const tempPath = inputPath.replace(
        '.png',
        `.temp-posterize_${Date.now()}.png`
      );
      await processedImage.write(tempPath as `${string}.${string}`);

      const svg = await new Promise<string>((resolve, reject) => {
        potrace.posterize(
          tempPath,
          {
            steps,
            ...options,
          },
          (err: any, result: string) => {
            // Clean up temp file
            unlinkSync(tempPath);

            if (err) reject(err);
            else resolve(result);
          }
        );
      });

      await fs.writeFile(outputPath, svg);
      console.log(`✅ Posterized SVG created: ${outputPath}`);
    } catch (error) {
      console.error('❌ Posterized conversion failed:', error);
      throw error;
    }
  }

  /**
   * Utility: Get optimal settings for different image types
   */
  static getPresetOptions(
    preset: 'logo' | 'photo' | 'drawing' | 'text'
  ): ConversionOptions {
    switch (preset) {
      case 'logo':
        return {
          threshold: 128,
          turdSize: 2,
          optCurve: true,
          optTolerance: 0.2,
          turnPolicy: 'minority',
        };

      case 'photo':
        return {
          threshold: 120,
          turdSize: 4,
          optCurve: true,
          optTolerance: 0.3,
          turnPolicy: 'majority',
        };

      case 'drawing':
        return {
          threshold: 140,
          turdSize: 1,
          optCurve: true,
          optTolerance: 0.1,
          turnPolicy: 'minority',
        };

      case 'text':
        return {
          threshold: 128,
          turdSize: 1,
          optCurve: false,
          optTolerance: 0.1,
          turnPolicy: 'black',
        };

      default:
        return {};
    }
  }
}
