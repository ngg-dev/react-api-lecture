import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
await mkdir(resolve(root, 'dist'), { recursive: true });
for (const name of ['index.html', 'styles.css', 'content.js', 'demos.js', 'app.js']) {
  await copyFile(resolve(root, name), resolve(root, 'dist', name));
}
console.log('Лекция собрана в dist/');
