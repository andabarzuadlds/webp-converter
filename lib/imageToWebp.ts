export type ImageFormat = "png" | "jpg" | "webp" | "heic";

export interface ConversionOptions {
  quality: number; // 0.01 - 1.0
  maxWidth?: number;
  outputFormat: ImageFormat;
}

/**
 * Convierte una imagen (File o URL) a un formato específico usando Canvas API.
 * Soporta redimensionamiento opcional por maxWidth manteniendo aspect ratio.
 */
export function convertImage(
  source: File | string,
  options: ConversionOptions
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

      // Determinar el MIME type según el formato de salida
      let mimeType: string;
      switch (options.outputFormat) {
        case "png":
          mimeType = "image/png";
          break;
        case "jpg":
          mimeType = "image/jpeg";
          break;
        case "webp":
          mimeType = "image/webp";
          break;
        case "heic":
          // HEIC no es soportado nativamente por Canvas, convertir a JPEG como fallback
          mimeType = "image/jpeg";
          break;
        default:
          mimeType = "image/png";
      }

      // Para PNG, la calidad se ignora, pero para JPEG y WebP sí se usa
      const quality = options.outputFormat === "png" ? undefined : options.quality;

      canvas.toBlob(
        (blob) => {
          if (blob) revokeAndResolve(blob);
          else {
            const errorMsg = options.outputFormat === "webp"
              ? "toBlob no devolvió datos (WebP puede no estar soportado)"
              : "Error al convertir la imagen";
            revokeAndReject(new Error(errorMsg));
          }
        },
        mimeType,
        quality
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
 * @deprecated Usa convertImage en su lugar
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
  return convertImage(source, { ...options, outputFormat: "webp" });
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

/**
 * Obtiene el MIME type aceptado para un formato de imagen.
 */
export function getAcceptString(formats: ImageFormat[]): string {
  const mimeMap: Record<ImageFormat, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp",
    heic: "image/heic,image/heif",
  };
  return formats.map(f => mimeMap[f]).join(",");
}

/**
 * Obtiene la extensión de archivo para un formato.
 */
export function getFileExtension(format: ImageFormat): string {
  return format === "jpg" ? "jpg" : format;
}
