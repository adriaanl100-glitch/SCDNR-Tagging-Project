const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.75;

let logoImagePromise = null;

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

function resolveLogoUrl() {
  const base = document.querySelector('link[rel="manifest"]')?.href || window.location.href;
  return new URL('assets/scdnr-tagging-logo.png', base).href;
}

function loadLogoImage() {
  if (!logoImagePromise) {
    logoImagePromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load SCDNR logo'));
      img.src = resolveLogoUrl();
    });
  }
  return logoImagePromise;
}

function drawWithLogo(ctx, photo, logo, width, height) {
  ctx.drawImage(photo, 0, 0, width, height);

  const logoMaxWidth = Math.min(width * 0.28, 180);
  const logoScale = logoMaxWidth / logo.width;
  const logoW = logo.width * logoScale;
  const logoH = logo.height * logoScale;
  const padding = Math.max(8, width * 0.02);

  ctx.drawImage(logo, width - logoW - padding, height - logoH - padding, logoW, logoH);
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
  ctx.drawImage(img, 0, 0, width, height);

  if (watermark) {
    try {
      const logo = await loadLogoImage();
      drawWithLogo(ctx, img, logo, width, height);
    } catch {
      /* still return compressed photo without logo stamp */
    }
  }

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const base64Length = dataUrl.length - 'data:image/jpeg;base64,'.length;
  const byteSize = Math.ceil((base64Length * 3) / 4);

  return { dataUrl, width, height, byteSize };
}

export { MAX_WIDTH, JPEG_QUALITY };
