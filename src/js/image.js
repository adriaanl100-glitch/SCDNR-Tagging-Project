const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.75;
const WATERMARK_TEXT = 'SCDNR Saltwater Tagging Program';

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function drawWithWatermark(ctx, img, width, height) {
  ctx.drawImage(img, 0, 0, width, height);
  const fontSize = Math.max(14, Math.floor(width * 0.04));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 2;
  const padding = 8;
  const textWidth = ctx.measureText(WATERMARK_TEXT).width;
  const x = width - textWidth - padding;
  const y = height - padding;
  ctx.strokeText(WATERMARK_TEXT, x, y);
  ctx.fillText(WATERMARK_TEXT, x, y);
}

export function computeScaledDimensions(imgWidth, imgHeight, maxWidth = MAX_WIDTH) {
  if (imgWidth <= maxWidth) return { width: imgWidth, height: imgHeight };
  const ratio = maxWidth / imgWidth;
  return { width: maxWidth, height: Math.round(imgHeight * ratio) };
}

export async function compressImage(file, options = {}) {
  const maxWidth = options.maxWidth ?? MAX_WIDTH;
  const quality = options.quality ?? JPEG_QUALITY;
  const watermark = options.watermark !== false;

  const img = await loadImageFromFile(file);
  const { width, height } = computeScaledDimensions(img.width, img.height, maxWidth);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (watermark) {
    drawWithWatermark(ctx, img, width, height);
  } else {
    ctx.drawImage(img, 0, 0, width, height);
  }

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
  const byteSize = Math.ceil((base64Length * 3) / 4);

  return { dataUrl, width, height, byteSize };
}

export { MAX_WIDTH, JPEG_QUALITY, WATERMARK_TEXT };
