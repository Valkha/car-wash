const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'assets', 'images');

// Bandeaux hero des pages prestations.
// Sources : assets/images/prestations-src/<id>.png, generees le 13.10.2026.
// Largeur de sortie 1024 px = largeur exacte de la colonne de contenu
// (max-w-5xl). La bande n'est volontairement PAS en pleine largeur : sur un
// ecran large, une image de 1024 px etiree serait floue. Contenue, elle reste
// a sa taille native quelle que soit la largeur de l'ecran.
const PRESTATIONS = ['ciel-etoile', 'ppf', 'covering', 'polish-ceramique', 'nettoyage-chassis'];

const tachesPrestations = PRESTATIONS.flatMap(id => [
    {
        input: path.join(IMAGES_DIR, 'prestations-src', `${id}.png`),
        output: path.join(IMAGES_DIR, 'prestations', `${id}.avif`),
        width: 1024, format: 'avif', quality: 50,
        label: `prestations-src/${id}.png → prestations/${id}.avif`
    },
    {
        input: path.join(IMAGES_DIR, 'prestations-src', `${id}.png`),
        output: path.join(IMAGES_DIR, 'prestations', `${id}.webp`),
        width: 1024, format: 'webp', quality: 68,
        label: `prestations-src/${id}.png → prestations/${id}.webp (repli)`
    }
]);

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
    },
    {
        input: path.join(IMAGES_DIR, 'hero-bg-raw.jpg'),
        output: path.join(IMAGES_DIR, 'hero-bg-opt.webp'),
        width: 1200,
        format: 'webp',
        quality: 75,
        label: 'hero-bg-raw.jpg → hero-bg-opt.webp (LCP hero background)'
    },
    {
        input: path.join(IMAGES_DIR, 'MB-01-opt.webp'),
        output: path.join(IMAGES_DIR, 'MB-01-opt-sm.webp'),
        width: 400,
        format: 'webp',
        quality: 80,
        label: 'MB-01-opt.webp → MB-01-opt-sm.webp (mobile srcset)'
    },
    {
        input: path.join(IMAGES_DIR, 'MB-01-opt.webp'),
        output: path.join(IMAGES_DIR, 'MB-01-opt-xs.webp'),
        width: 600,
        format: 'webp',
        quality: 80,
        label: 'MB-01-opt.webp → MB-01-opt-xs.webp (600w srcset)'
    },
    {
        input: path.join(IMAGES_DIR, 'logo-v2.webp'),
        output: path.join(IMAGES_DIR, 'logo-v2-tiny.webp'),
        width: 120,
        format: 'webp',
        quality: 90,
        label: 'logo-v2.webp → logo-v2-tiny.webp (header retina)'
    },
    {
        input: path.join(IMAGES_DIR, 'logo-v2.webp'),
        output: path.join(IMAGES_DIR, 'logo-mobile.webp'),
        width: 100,
        format: 'webp',
        quality: 90,
        label: 'logo-v2.webp → logo-mobile.webp (mobile header)'
    }
];

async function optimizeImage(task) {
    const before = fs.statSync(task.input).size;

    const pipeline = sharp(task.input).resize({ width: task.width, withoutEnlargement: true });

    if (task.format === 'webp') {
        pipeline.webp({ quality: task.quality });
    } else if (task.format === 'avif') {
        pipeline.avif({ quality: task.quality, effort: 4 });
    }

    const buffer = await pipeline.toBuffer();
    fs.mkdirSync(path.dirname(task.output), { recursive: true });
    fs.writeFileSync(task.output, buffer);

    const after = fs.statSync(task.output).size;
    const saved = (((before - after) / before) * 100).toFixed(1);
    const toKB = (b) => (b / 1024).toFixed(1) + ' Ko';

    console.log(`✅ ${task.label}`);
    console.log(`   Avant : ${toKB(before)}  →  Après : ${toKB(after)}  (${saved}% économisé)`);
}

(async () => {
    console.log('🖼️  Optimisation des images — Clean Cars Wash\n');
    let ignorees = 0;
    // Une source absente ne doit plus arreter le script. Plusieurs sources
    // historiques (MB-01.webp, hero-bg-raw.jpg) ne sont pas dans le depot : la
    // premiere levait une ENOENT qui tuait tout le reste, donc les taches
    // suivantes ne s'executaient jamais.
    for (const task of [...tasks, ...tachesPrestations]) {
        if (!fs.existsSync(task.input)) {
            console.log(`⏭️  ${task.label} — source absente, ignoree.`);
            ignorees++;
            continue;
        }
        await optimizeImage(task);
    }
    console.log(`\n🚀 Images optimisées.${ignorees ? ` ${ignorees} tâche(s) ignorée(s), source absente.` : ''}`);
})();
