/**
 * Client-side image optimization:
 * - Resizes large images (up to 4000px) down to optimal vision dimensions (max 1200px)
 * - Compresses to JPEG at 0.8 quality
 * - Drastically reduces token usage, latency and bandwidth (often from 8MB down to ~90KB)
 */
export async function optimizeImageForVision(file: File): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  sizeKb: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível processar a imagem no navegador."));
        }

        // Draw image with smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data url
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          sizeKb: approxSizeKb,
        });
      };

      img.onerror = () => reject(new Error("Erro ao carregar os dados da imagem."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Erro ao ler arquivo da imagem."));
    reader.readAsDataURL(file);
  });
}

