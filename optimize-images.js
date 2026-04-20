const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'assets', 'images');

const tasks = [
    {
        input: path.join(IMAGES_DIR, 'MB-01.webp'),
        output: path.join(IMAGES_DIR, 'MB-01-opt.webp'),
        width: 720,
        format: 'webp',
        quality: 80,
        label: 'MB-01.webp → MB-01-opt.webp (LCP hero)'
    },
    {
        input: path.join(IMAGES_DIR, 'MB-02.webp'),
        output: path.join(IMAGES_DIR, 'MB-02-opt.webp'),
        width: 720,
        format: 'webp',
        quality: 80,
        label: 'MB-02.webp → MB-02-opt.webp'
    },
    {
        input: path.join(IMAGES_DIR, 'MB-03.webp'),
        output: path.join(IMAGES_DIR, 'MB-03-opt.webp'),
        width: 720,
        format: 'webp',
        quality: 80,
        label: 'MB-03.webp → MB-03-opt.webp'
    },
    {
        input: path.join(IMAGES_DIR, 'VW-8R.webp'),
        output: path.join(IMAGES_DIR, 'VW-8R-opt.webp'),
        width: 720,
        format: 'webp',
        quality: 80,
        label: 'VW-8R.webp → VW-8R-opt.webp'
    },
    {
        input: path.join(IMAGES_DIR, 'logo-v2.png'),
        output: path.join(IMAGES_DIR, 'logo-v2.webp'),
        width: 200,
        format: 'webp',
        quality: 90,
        label: 'logo-v2.png → logo-v2.webp'
    }
];

async function optimizeImage(task) {
    const before = fs.statSync(task.input).size;

    const pipeline = sharp(task.input).resize({ width: task.width, withoutEnlargement: true });

    if (task.format === 'webp') {
        pipeline.webp({ quality: task.quality });
    }

    const buffer = await pipeline.toBuffer();
    fs.writeFileSync(task.output, buffer);

    const after = fs.statSync(task.output).size;
    const saved = (((before - after) / before) * 100).toFixed(1);
    const toKB = (b) => (b / 1024).toFixed(1) + ' Ko';

    console.log(`✅ ${task.label}`);
    console.log(`   Avant : ${toKB(before)}  →  Après : ${toKB(after)}  (${saved}% économisé)`);
}

(async () => {
    console.log('🖼️  Optimisation des images — Clean Cars Wash\n');
    for (const task of tasks) {
        await optimizeImage(task);
    }
    console.log('\n🚀 Toutes les images ont été optimisées.');
})();
