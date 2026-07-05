import { ProcessedFile, AdminSettings } from '../types';

// Load heic2any dynamically from CDN when a HEIC file is uploaded
let heic2anyPromise: Promise<any> | null = null;
const loadHeic2any = (): Promise<any> => {
  if (heic2anyPromise) return heic2anyPromise;
  heic2anyPromise = new Promise((resolve, reject) => {
    if ((window as any).heic2any) {
      resolve((window as any).heic2any);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).heic2any) {
        resolve((window as any).heic2any);
      } else {
        reject(new Error("gagal mendeteksi heic2any di window"));
      }
    };
    script.onerror = () => {
      reject(new Error("Gagal mengunduh pustaka HEIC (heic2any)"));
    };
    document.body.appendChild(script);
  });
  return heic2anyPromise;
};

// Load UTIF dynamically from CDN when a TIFF file is uploaded
let utifPromise: Promise<any> | null = null;
const loadUtif = (): Promise<any> => {
  if (utifPromise) return utifPromise;
  utifPromise = new Promise((resolve, reject) => {
    if ((window as any).UTIF) {
      resolve((window as any).UTIF);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/utif.js/3.1.0/utif.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).UTIF) {
        resolve((window as any).UTIF);
      } else {
        reject(new Error("Gagal mendeteksi UTIF di window"));
      }
    };
    script.onerror = () => {
      reject(new Error("Gagal mengunduh pustaka TIFF (UTIF)"));
    };
    document.body.appendChild(script);
  });
  return utifPromise;
};

// Convert TIFF to a standard PNG Blob using UTIF
const convertTiffToPngBlob = async (arrayBuffer: ArrayBuffer): Promise<Blob> => {
  const UTIF = await loadUtif();
  const ifds = UTIF.decode(arrayBuffer);
  UTIF.decodeImage(arrayBuffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  const width = ifds[0].width;
  const height = ifds[0].height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Gagal membuat konteks 2D Canvas");

  const imgData = ctx.createImageData(width, height);
  imgData.data.set(rgba);
  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Gagal mengonversi TIFF ke Blob"));
    }, 'image/png');
  });
};

// SEO-friendly webp filename converter (e.g. "Produk Kayu Mahoni.png" -> "produk-kayu-mahoni.webp")
export const getWebpFilename = (originalName: string): string => {
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
  
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]+/g, '') // remove special characters except spaces, hyphens, underscores
    .trim()
    .replace(/[\s-_]+/g, '-')       // replace spaces, underscores, and hyphens with single hyphen
    .replace(/^-+|-+$/g, '');       // trim hyphens from both ends

  return `${sanitized || 'image'}.webp`;
};

// Helper to load HTMLImageElement from a URL
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar ke dalam elemen canvas."));
    img.src = url;
  });
};

// Helper for canvas.toBlob as Promise
const canvasToWebpBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/webp', quality);
  });
};

// High-quality stepped downscaling to prevent aliasing and blurriness
const drawScaledImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
) => {
  let currentWidth = img.naturalWidth;
  let currentHeight = img.naturalHeight;

  // Create an offscreen canvas for intermediate steps
  const offscreenCanvas = document.createElement('canvas');
  const offscreenCtx = offscreenCanvas.getContext('2d');
  if (!offscreenCtx) {
    // Fallback to direct draw if canvas creation fails
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    return;
  }

  offscreenCanvas.width = currentWidth;
  offscreenCanvas.height = currentHeight;
  offscreenCtx.imageSmoothingEnabled = true;
  offscreenCtx.imageSmoothingQuality = 'high';
  offscreenCtx.drawImage(img, 0, 0);

  // Step down by max 50% width/height per iteration to maintain crispness and avoid aliasing
  while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.round(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.round(currentHeight / 2));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = nextWidth;
    tempCanvas.height = nextHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) break;

    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(offscreenCanvas, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight);

    // Resize offscreen canvas for the next iteration
    offscreenCanvas.width = nextWidth;
    offscreenCanvas.height = nextHeight;
    offscreenCtx.imageSmoothingEnabled = true;
    offscreenCtx.imageSmoothingQuality = 'high';
    offscreenCtx.drawImage(tempCanvas, 0, 0);

    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  // Draw the final step onto the destination canvas context
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(offscreenCanvas, 0, 0, currentWidth, currentHeight, 0, 0, targetWidth, targetHeight);
};

export interface ProcessProgress {
  status: ProcessedFile['status'];
  progress: number;
}

export const processSingleImage = async (
  file: File,
  settings: AdminSettings,
  onProgress: (state: ProcessProgress) => void
): Promise<Omit<ProcessedFile, 'id'>> => {
  onProgress({ status: 'converting', progress: 10 });

  let srcBlob: Blob = file;
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
  const isTiff = file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif') || file.type === 'image/tiff';

  // HEIC conversion
  if (isHeic) {
    try {
      const heic2any = await loadHeic2any();
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
      });
      srcBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (e: any) {
      throw new Error(`Gagal memproses format HEIC: ${e.message || 'Pustaka tidak dapat dimuat'}`);
    }
  }

  // TIFF conversion
  if (isTiff) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      srcBlob = await convertTiffToPngBlob(arrayBuffer);
    } catch (e: any) {
      throw new Error(`Gagal memproses format TIFF: ${e.message || 'Format TIFF rusak atau tidak didukung'}`);
    }
  }

  onProgress({ status: 'converting', progress: 30 });

  // Load the image to measure dimensions and draw on canvas
  const originalUrl = URL.createObjectURL(srcBlob);
  let img: HTMLImageElement;
  try {
    img = await loadImage(originalUrl);
  } catch (err) {
    URL.revokeObjectURL(originalUrl);
    throw err;
  }

  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  // Let's create a temporary canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(originalUrl);
    throw new Error("Gagal menginisialisasi HTML Canvas context");
  }

  onProgress({ status: 'compressing', progress: 50 });

  const maxOutputBytes = settings.maxOutputSizeKb * 1024;
  let quality = 90;
  let scale = 1.0;
  let compressedBlob: Blob | null = null;
  let finalWidth = originalWidth;
  let finalHeight = originalHeight;
  let success = false;

  // Loop compression and scaling
  // Loop starts with scale = 1.0 and goes down, quality starts with 90 and goes down to minQuality (default 40)
  while (scale > 0.05) {
    finalWidth = Math.round(originalWidth * scale);
    finalHeight = Math.round(originalHeight * scale);

    // If dimensions become too small, stop
    if (finalWidth < 10 || finalHeight < 10) {
      break;
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;
    ctx.clearRect(0, 0, finalWidth, finalHeight);

    if (scale === 1.0) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
    } else {
      drawScaledImage(ctx, img, finalWidth, finalHeight);
    }

    // Try reducing qualities from 90 to minQuality by steps of 5
    for (quality = 90; quality >= settings.minQuality; quality -= 5) {
      compressedBlob = await canvasToWebpBlob(canvas, quality / 100);
      if (compressedBlob && compressedBlob.size <= maxOutputBytes) {
        success = true;
        break;
      }
    }

    if (success) {
      break;
    }

    // If autoResize is disabled, we cannot scale down! We must break and show error
    if (!settings.autoResizeEnabled) {
      break;
    }

    // Scale down by 10%
    scale *= 0.9;
  }

  onProgress({ status: 'compressing', progress: 90 });

  if (!success || !compressedBlob || compressedBlob.size > maxOutputBytes) {
    URL.revokeObjectURL(originalUrl);
    throw new Error("Gambar terlalu kompleks untuk diproses tanpa kehilangan kualitas yang signifikan.");
  }

  const compressedUrl = URL.createObjectURL(compressedBlob);
  const savingsPercentage = Math.round(((file.size - compressedBlob.size) / file.size) * 100);

  return {
    name: file.name,
    outputName: getWebpFilename(file.name),
    originalSize: file.size,
    originalFormat: file.type || file.name.split('.').pop() || 'unknown',
    originalWidth,
    originalHeight,
    compressedSize: compressedBlob.size,
    compressedWidth: finalWidth,
    compressedHeight: finalHeight,
    compressedBlob,
    compressedUrl,
    originalUrl,
    status: 'success',
    progress: 100,
    errorMsg: null,
    savingsPercentage: savingsPercentage,
    qualityUsed: quality,
    resizedRatio: Number(scale.toFixed(2)),
  };
};
