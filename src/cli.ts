#!/usr/bin/env node

import { Command } from 'commander';
import { PngToSvgConverter } from './converter.js';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('png-to-svg')
  .description('Convert PNG images to SVG using potrace')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert a PNG file to SVG')
  .argument('<input>', 'Input PNG file path')
  .argument('<output>', 'Output SVG file path')
  .option('-t, --threshold <number>', 'Black/white threshold (0-255)', '128')
  .option(
    '-s, --turd-size <number>',
    'Suppress speckles of up to this size',
    '2'
  )
  .option('-a, --alpha-max <number>', 'Corner threshold parameter', '1')
  .option('--no-opt-curve', 'Disable curve optimization')
  .option('-o, --opt-tolerance <number>', 'Curve optimization tolerance', '0.2')
  .option('-p, --turn-policy <policy>', 'Turn policy', 'minority')
  .option('--no-black-on-white', 'Invert colors')
  .option(
    '--preset <type>',
    'Use preset for specific image type (logo|photo|drawing|text)'
  )
  .action(async (input: string, output: string, options: any) => {
    try {
      const converter = new PngToSvgConverter();

      // input file
      if (!fs.existsSync(input)) {
        console.error(`❌ Input file not found: ${input}`);
        process.exit(1);
      }

      // output directory if it doesn't exist
      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // build options
      let conversionOptions: any = {};

      if (options.preset) {
        conversionOptions = PngToSvgConverter.getPresetOptions(options.preset);
        console.log(`🎯 Using preset: ${options.preset}`);
      }

      // override with CLI options
      if (options.threshold)
        conversionOptions.threshold = parseInt(options.threshold);
      if (options.turdSize)
        conversionOptions.turdSize = parseInt(options.turdSize);
      if (options.alphaMax)
        conversionOptions.alphaMax = parseFloat(options.alphaMax);
      if (options.optCurve === false) conversionOptions.optCurve = false;
      if (options.optTolerance)
        conversionOptions.optTolerance = parseFloat(options.optTolerance);
      if (options.turnPolicy) conversionOptions.turnPolicy = options.turnPolicy;
      if (options.blackOnWhite === false)
        conversionOptions.blackOnWhite = false;

      console.log('⚙️  Options:', conversionOptions);

      // convert
      await converter.convertFile(input, output, conversionOptions);
    } catch (error) {
      console.error('❌ Conversion failed:', error);
      process.exit(1);
    }
  });

program
  .command('posterize')
  .description('Create a posterized SVG with multiple color levels')
  .argument('<input>', 'Input PNG file path')
  .argument('<output>', 'Output SVG file path')
  .option('-s, --steps <number>', 'Number of color steps', '4')
  .option('-t, --threshold <number>', 'Black/white threshold (0-255)', '128')
  .option(
    '--preset <type>',
    'Use preset for specific image type (logo|photo|drawing|text)'
  )
  .action(async (input: string, output: string, options: any) => {
    try {
      const converter = new PngToSvgConverter();

      if (!fs.existsSync(input)) {
        console.error(`❌ Input file not found: ${input}`);
        process.exit(1);
      }

      const outputDir = path.dirname(output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let conversionOptions: any = {};
      if (options.preset) {
        conversionOptions = PngToSvgConverter.getPresetOptions(options.preset);
      }
      if (options.threshold)
        conversionOptions.threshold = parseInt(options.threshold);

      const steps = parseInt(options.steps) || 4;

      await converter.convertToPosterized(
        input,
        output,
        steps,
        conversionOptions
      );
    } catch (error) {
      console.error('❌ Posterization failed:', error);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Convert multiple PNG files to SVG')
  .argument('<input-dir>', 'Input directory containing PNG files')
  .argument('<output-dir>', 'Output directory for SVG files')
  .option(
    '--preset <type>',
    'Use preset for specific image type (logo|photo|drawing|text)'
  )
  .action(async (inputDir: string, outputDir: string, options: any) => {
    try {
      const converter = new PngToSvgConverter();

      if (!fs.existsSync(inputDir)) {
        console.error(`❌ Input directory not found: ${inputDir}`);
        process.exit(1);
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let conversionOptions: any = {};
      if (options.preset) {
        conversionOptions = PngToSvgConverter.getPresetOptions(options.preset);
      }

      const files = fs
        .readdirSync(inputDir)
        .filter((file) => file.toLowerCase().endsWith('.png'));

      console.log(`📁 Found ${files.length} PNG files`);

      for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(
          outputDir,
          file.replace(/\.png$/i, '.svg')
        );

        try {
          await converter.convertFile(inputPath, outputPath, conversionOptions);
        } catch (error) {
          console.error(`❌ Failed to convert ${file}:`, error);
        }
      }

      console.log('🎉 Batch conversion completed!');
    } catch (error) {
      console.error('❌ Batch conversion failed:', error);
      process.exit(1);
    }
  });

program.parse();
