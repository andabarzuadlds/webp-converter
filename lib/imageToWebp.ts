/**
 * Convierte una imagen (File o URL) a Blob WebP usando Canvas API.
 * Soporta redimensionamiento opcional por maxWidth manteniendo aspect ratio.
 */
export function imageToWebp(
  source: File | string,
  options: {
    quality: number; // 0.01 - 1.0
    maxWidth?: number;
  }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };

    img.onerror = () => {
      cleanup();
      reject(new Error("Error al cargar la imagen"));
    };

    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (options.maxWidth != null && options.maxWidth > 0 && width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width);
        width = options.maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas 2D no disponible"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) revokeAndResolve(blob);
          else revokeAndReject(new Error("toBlob no devolvió datos (WebP puede no estar soportado)"));
        },
        "image/webp",
        options.quality
      );
    };

    let objectUrl: string | null = null;
    if (typeof source === "string") {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    const revokeAndResolve = (blob: Blob) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      cleanup();
      resolve(blob);
    };
    const revokeAndReject = (err: Error) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      cleanup();
      reject(err);
    };
  });
}

/**
 * Obtiene las dimensiones naturales de una imagen (File).
 * Revoca el object URL internamente.
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Error al cargar la imagen"));
    };
    img.src = url;
  });
}

/**
 * Comprueba si el navegador soporta exportar a WebP (toBlob con image/webp).
 */
export function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(false);
      return;
    }
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 1, 1);
    canvas.toBlob(
      (blob) => resolve(!!blob),
      "image/webp",
      0.8
    );
  });
}
