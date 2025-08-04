#!/usr/bin/env node

import { PngToSvgConverter } from './converter.js';
import * as fs from 'fs';
import * as path from 'path';
import { Worker } from 'worker_threads';
import { performance } from 'perf_hooks';

interface BulkConversionOptions {
  preset?: 'logo' | 'photo' | 'drawing' | 'text';
  threshold?: number;
  turdSize?: number;
  optCurve?: boolean;
  turnPolicy?: string;
  parallel?: boolean;
  maxWorkers?: number;
  recursive?: boolean;
  overwrite?: boolean;
  filterSize?: { min?: number; max?: number };
}

class BulkConverter {
  private converter = new PngToSvgConverter();
  private stats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    startTime: 0,
    endTime: 0,
  };

  /**
   * Convert all PNG files in a directory (and subdirectories if recursive)
   */
  async convertDirectory(
    inputDir: string,
    outputDir: string,
    options: BulkConversionOptions = {}
  ): Promise<void> {
    console.log('🚀 Starting bulk conversion...');
    console.log(`📂 Input: ${inputDir}`);
    console.log(`📂 Output: ${outputDir}`);
    console.log(`⚙️  Options:`, options);
    console.log('');

    this.stats.startTime = performance.now();

    // Find all PNG files
    const pngFiles = await this.findPngFiles(inputDir, options.recursive);
    this.stats.total = pngFiles.length;

    console.log(`📁 Found ${pngFiles.length} PNG files`);

    if (pngFiles.length === 0) {
      console.log('ℹ️  No PNG files found.');
      return;
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Filter by size if specified
    const filteredFiles = await this.filterBySize(pngFiles, options.filterSize);
    console.log(`📏 After size filtering: ${filteredFiles.length} files`);

    // Convert files
    if (options.parallel && filteredFiles.length > 1) {
      await this.convertInParallel(filteredFiles, inputDir, outputDir, options);
    } else {
      await this.convertSequentially(
        filteredFiles,
        inputDir,
        outputDir,
        options
      );
    }

    this.stats.endTime = performance.now();
    this.printSummary();
  }

  /**
   * Find all PNG files in directory
   */
  private async findPngFiles(
    dir: string,
    recursive = false
  ): Promise<string[]> {
    const files: string[] = [];

    const searchDir = (currentDir: string) => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && recursive) {
          searchDir(fullPath);
        } else if (stat.isFile() && item.toLowerCase().endsWith('.png')) {
          files.push(fullPath);
        }
      }
    };

    searchDir(dir);
    return files;
  }

  /**
   * Filter files by size
   */
  private async filterBySize(
    files: string[],
    sizeFilter?: { min?: number; max?: number }
  ): Promise<string[]> {
    if (!sizeFilter) return files;

    const filtered: string[] = [];

    for (const file of files) {
      const stats = fs.statSync(file);
      const sizeKB = stats.size / 1024;

      if (sizeFilter.min && sizeKB < sizeFilter.min) continue;
      if (sizeFilter.max && sizeKB > sizeFilter.max) continue;

      filtered.push(file);
    }

    return filtered;
  }

  /**
   * Convert files sequentially
   */
  private async convertSequentially(
    files: string[],
    inputDir: string,
    outputDir: string,
    options: BulkConversionOptions
  ): Promise<void> {
    console.log('🔄 Converting files sequentially...\n');

    let conversionOptions: any = {};
    if (options.preset) {
      conversionOptions = PngToSvgConverter.getPresetOptions(options.preset);
    }

    // Override with custom options
    if (options.threshold) conversionOptions.threshold = options.threshold;
    if (options.turdSize) conversionOptions.turdSize = options.turdSize;
    if (options.optCurve !== undefined)
      conversionOptions.optCurve = options.optCurve;
    if (options.turnPolicy) conversionOptions.turnPolicy = options.turnPolicy;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relativePath = path.relative(inputDir, file);
      const outputPath = path.join(
        outputDir,
        relativePath.replace(/\.png$/i, '.svg')
      );

      console.log(`[${i + 1}/${files.length}] ${relativePath}`);

      // Check if output exists and skip if not overwriting
      if (!options.overwrite && fs.existsSync(outputPath)) {
        console.log('   ⏭️  Skipped (already exists)');
        this.stats.skipped++;
        continue;
      }

      // Create output directory if needed
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }

      try {
        const startTime = performance.now();
        await this.converter.convertFile(file, outputPath, conversionOptions);
        const endTime = performance.now();

        console.log(`   ✅ Converted in ${(endTime - startTime).toFixed(0)}ms`);
        this.stats.successful++;
      } catch (error) {
        console.log(
          `   ❌ Failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        this.stats.failed++;
      }
    }
  }

  /**
   * Convert files in parallel (faster but uses more resources)
   */
  private async convertInParallel(
    files: string[],
    inputDir: string,
    outputDir: string,
    options: BulkConversionOptions
  ): Promise<void> {
    const maxWorkers = options.maxWorkers || Math.min(4, files.length);
    console.log(`🔄 Converting files in parallel (${maxWorkers} workers)...\n`);

    const chunks = this.chunkArray(files, Math.ceil(files.length / maxWorkers));
    const promises = chunks.map((chunk, index) =>
      this.processChunk(chunk, inputDir, outputDir, options, index)
    );

    await Promise.all(promises);
  }

  /**
   * Process a chunk of files
   */
  private async processChunk(
    files: string[],
    inputDir: string,
    outputDir: string,
    options: BulkConversionOptions,
    workerIndex: number
  ): Promise<void> {
    let conversionOptions: any = {};
    if (options.preset) {
      conversionOptions = PngToSvgConverter.getPresetOptions(options.preset);
    }

    // Override with custom options
    if (options.threshold) conversionOptions.threshold = options.threshold;
    if (options.turdSize) conversionOptions.turdSize = options.turdSize;
    if (options.optCurve !== undefined)
      conversionOptions.optCurve = options.optCurve;
    if (options.turnPolicy) conversionOptions.turnPolicy = options.turnPolicy;

    for (const file of files) {
      const relativePath = path.relative(inputDir, file);
      const outputPath = path.join(
        outputDir,
        relativePath.replace(/\.png$/i, '.svg')
      );

      console.log(`[Worker ${workerIndex + 1}] ${relativePath}`);

      // Check if output exists and skip if not overwriting
      if (!options.overwrite && fs.existsSync(outputPath)) {
        console.log(
          `[Worker ${workerIndex + 1}]    ⏭️  Skipped (already exists)`
        );
        this.stats.skipped++;
        continue;
      }

      // Create output directory if needed
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }

      try {
        const startTime = performance.now();
        await this.converter.convertFile(file, outputPath, conversionOptions);
        const endTime = performance.now();

        console.log(
          `[Worker ${workerIndex + 1}]    ✅ Converted in ${(
            endTime - startTime
          ).toFixed(0)}ms`
        );
        this.stats.successful++;
      } catch (error) {
        console.log(
          `[Worker ${workerIndex + 1}]    ❌ Failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        this.stats.failed++;
      }
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Print conversion summary
   */
  private printSummary(): void {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;

    console.log('\n🎉 Bulk Conversion Complete!');
    console.log('================================');
    console.log(`📊 Total files: ${this.stats.total}`);
    console.log(`✅ Successful: ${this.stats.successful}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);

    if (this.stats.successful > 0) {
      console.log(
        `📈 Average: ${(duration / this.stats.successful).toFixed(2)}s per file`
      );
    }
  }
}

// Export for use as module
export { BulkConverter, BulkConversionOptions };

// CLI usage if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      'Usage: node bulk-converter.js <input-dir> <output-dir> [options]'
    );
    console.log('');
    console.log('Options:');
    console.log('  --preset <type>       Use preset (logo|photo|drawing|text)');
    console.log('  --threshold <num>     Black/white threshold (0-255)');
    console.log('  --parallel            Enable parallel processing');
    console.log('  --recursive           Process subdirectories');
    console.log('  --overwrite           Overwrite existing files');
    console.log('  --max-workers <num>   Max parallel workers (default: 4)');
    console.log('  --min-size <kb>       Skip files smaller than X KB');
    console.log('  --max-size <kb>       Skip files larger than X KB');
    process.exit(1);
  }

  const [inputDir, outputDir] = args;
  const options: BulkConversionOptions = {};

  // Parse options
  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--preset':
        options.preset = value as any;
        break;
      case '--threshold':
        options.threshold = parseInt(value);
        break;
      case '--max-workers':
        options.maxWorkers = parseInt(value);
        break;
      case '--min-size':
        options.filterSize = { ...options.filterSize, min: parseInt(value) };
        break;
      case '--max-size':
        options.filterSize = { ...options.filterSize, max: parseInt(value) };
        break;
      case '--parallel':
        options.parallel = true;
        i--; // No value for this flag
        break;
      case '--recursive':
        options.recursive = true;
        i--; // No value for this flag
        break;
      case '--overwrite':
        options.overwrite = true;
        i--; // No value for this flag
        break;
    }
  }

  const bulkConverter = new BulkConverter();
  bulkConverter
    .convertDirectory(inputDir, outputDir, options)
    .catch(console.error);
}
