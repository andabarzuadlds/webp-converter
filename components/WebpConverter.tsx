"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { ImageCard, type ImageItemData } from "./ImageCard";
import { checkWebPSupport, getImageDimensions, imageToWebp } from "@/lib/imageToWebp";
import { formatBytes } from "@/lib/formatBytes";

interface ImageItem extends ImageItemData {
  file: File;
  webpBlob: Blob | null;
}

const ACCEPT = "image/jpeg,image/png";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function baseName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  return lastDot > 0 ? fileName.slice(0, lastDot) : fileName;
}

export function WebpConverter() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxWidthNum = maxWidth.trim() ? parseInt(maxWidth, 10) : undefined;
  const validMaxWidth = maxWidthNum != null && !isNaN(maxWidthNum) && maxWidthNum > 0 ? maxWidthNum : undefined;

  const itemsRef = useRef<ImageItem[]>([]);
  itemsRef.current = items;

  const checkSupport = useCallback(() => {
    checkWebPSupport().then(setWebpSupported);
  }, []);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const list: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f && (f.type === "image/jpeg" || f.type === "image/png")) list.push(f);
    }
    if (list.length === 0) return;

    Promise.all(
      list.map(async (file) => {
        const originalUrl = URL.createObjectURL(file);
        const { width, height } = await getImageDimensions(file);
        return {
          id: generateId(),
          file,
          fileName: file.name,
          originalUrl,
          width,
          height,
          originalSize: file.size,
          webpBlob: null,
          webpUrl: null,
          webpSize: null,
          error: null,
          converting: true,
        } satisfies ImageItem;
      })
    ).then((newItems) => {
      setItems((prev) => [...prev, ...newItems]);
    });
  }, []);

  const convertAll = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    const qualityNorm = quality / 100;
    const maxW = validMaxWidth;

    setItems((prev) =>
      prev.map((it) => ({ ...it, converting: true, error: null }))
    );

    const results = await Promise.allSettled(
      current.map((it) =>
        imageToWebp(it.originalUrl, { quality: qualityNorm, maxWidth: maxW })
      )
    );

    setItems((prev) =>
      prev.map((item, i) => {
        const result = results[i];
        if (result.status === "fulfilled") {
          const blob = result.value;
          const oldUrl = item.webpUrl;
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          const webpUrl = URL.createObjectURL(blob);
          return {
            ...item,
            webpBlob: blob,
            webpUrl,
            webpSize: blob.size,
            converting: false,
            error: null,
          };
        }
        const oldUrl = item.webpUrl;
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return {
          ...item,
          webpBlob: null,
          webpUrl: null,
          webpSize: null,
          converting: false,
          error: result.reason?.message ?? "Error de conversión",
        };
      })
    );
  }, [quality, validMaxWidth]);

  // Al añadir imágenes, convertir todas (incluidas las nuevas).
  const itemIds = items.map((i) => i.id).join(",");
  useEffect(() => {
    if (items.length === 0 || webpSupported !== true) return;
    convertAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar lista de ítems o soporte WebP
  }, [itemIds, webpSupported]);

  // Al cambiar calidad o ancho máximo, recalcular WebP de todas.
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (items.length === 0) return;
    convertAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: quality y validMaxWidth
  }, [quality, validMaxWidth]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.originalUrl);
        if (item.webpUrl) URL.revokeObjectURL(item.webpUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const downloadItem = useCallback((id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item?.webpBlob) return;
    const name = `${baseName(item.file.name)}.webp`;
    downloadBlob(item.webpBlob, name);
  }, [items]);

  const downloadAll = useCallback(async () => {
    const withBlob = items.filter((i) => i.webpBlob);
    if (withBlob.length === 0) return;
    const zip = new JSZip();
    withBlob.forEach((it) => {
      const name = `${baseName(it.file.name)}.webp`;
      zip.file(name, it.webpBlob!);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "webp-images.zip");
  }, [items]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const totalOriginal = items.reduce((s, i) => s + i.originalSize, 0);
  const totalWebp = items.reduce((s, i) => s + (i.webpSize ?? 0), 0);
  const totalSavings = totalOriginal - totalWebp;

  if (webpSupported === false) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <p className="font-medium">Tu navegador no soporta exportar a WebP.</p>
        <p className="mt-1 text-sm">Prueba con Chrome, Edge o Firefox actualizado.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          JPG/PNG → WebP
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Convierte imágenes en el navegador. Sin subir a ningún servidor.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-slate-500"
          }`}
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Arrastra imágenes aquí o haz clic para seleccionar
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            JPG y PNG
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Calidad WebP (1–100): {quality}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Ancho máximo (px, opcional)
            </label>
            <input
              type="number"
              min={1}
              placeholder="Sin límite"
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={convertAll}
            disabled={items.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Convertir todas
          </button>
          <button
            type="button"
            onClick={downloadAll}
            disabled={items.filter((i) => i.webpBlob).length === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            Descargar todo (ZIP)
          </button>
        </div>

        {items.length > 0 && totalSavings > 0 && (
          <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Ahorro total: {formatBytes(totalSavings)}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
          Aún no hay imágenes. Arrastra o selecciona archivos arriba.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ImageCard
              key={item.id}
              item={{
                id: item.id,
                fileName: item.fileName,
                originalUrl: item.originalUrl,
                width: item.width,
                height: item.height,
                originalSize: item.originalSize,
                webpUrl: item.webpUrl,
                webpSize: item.webpSize,
                error: item.error,
                converting: item.converting,
              }}
              onDownload={() => downloadItem(item.id)}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
