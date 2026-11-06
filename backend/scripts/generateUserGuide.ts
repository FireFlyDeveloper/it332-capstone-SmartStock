import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGuidePdf } from '../src/docs/userGuidePdf.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const inputPath = resolve(repositoryRoot, 'docs/SmartStock-User-Guide.md');
const outputPath = resolve(repositoryRoot, 'docs/SmartStock-User-Guide.pdf');

await writeGuidePdf(inputPath, outputPath);
console.log('Wrote docs/SmartStock-User-Guide.pdf');
