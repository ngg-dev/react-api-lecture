import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
for (const name of ['content.js', 'demos.js', 'app.js']) {
  new vm.Script(await readFile(resolve(root, name), 'utf8'), { filename: name });
}
const context = { window: {} };
vm.runInNewContext(await readFile(resolve(root, 'content.js'), 'utf8'), context);
const lecture = context.window.LECTURE;
assert(lecture?.slides?.length >= 30, 'Не хватает слайдов лекции');
assert.equal(new Set(lecture.slides.map(s => s.id)).size, lecture.slides.length, 'Повторяющиеся ID слайдов');
const chapters = new Set(lecture.chapters.map(c => c.id));
assert.equal(lecture.chapters.reduce((n, c) => n + c.minutes, 0), 70, 'Тайминг глав должен составлять 70 минут');
for (const slide of lecture.slides) {
  assert(slide.title && slide.notes, `Заголовок или заметки отсутствуют: ${slide.id}`);
  assert(chapters.has(slide.chapter), `Неизвестная глава: ${slide.id}`);
  if (slide.demo) assert(['request', 'effect', 'race', 'architecture'].includes(slide.demo));
}
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const file of ['styles.css', 'content.js', 'demos.js', 'app.js']) assert(html.includes(file), `Не подключен ${file}`);
console.log(`Проверено: ${lecture.slides.length} слайдов, 70 минут, заметки, связи и синтаксис JS.`);
