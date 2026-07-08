const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads');

async function processUpload(file) {
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const sizes = [
    { suffix: '-lg',  width: 1200 },
    { suffix: '-md',  width: 600  },
    { suffix: '-sm',  width: 300  },
  ];

  for (const { suffix, width } of sizes) {
    const outPath = path.join(UPLOAD_DIR, `${name}${suffix}.webp`);
    await sharp(file.buffer)
      .resize(width, null, { withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outPath);
  }

  // Also keep original name for srcset reference
  return `/uploads/${name}`;
}

module.exports = { processUpload };
