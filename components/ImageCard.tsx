"use client";

import { formatBytes } from "@/lib/formatBytes";

export interface ImageItemData {
  id: string;
  fileName: string;
  originalUrl: string;
  width: number;
  height: number;
  originalSize: number;
  webpUrl: string | null;
  webpSize: number | null;
  error: string | null;
  converting: boolean;
}

interface ImageCardProps {
  item: ImageItemData;
  onDownload: () => void;
  onRemove: () => void;
}

export function ImageCard({ item, onDownload, onRemove }: ImageCardProps) {
  const reduction =
    item.webpSize != null && item.originalSize > 0
      ? ((1 - item.webpSize / item.originalSize) * 100).toFixed(1)
      : null;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="mb-3 truncate text-sm font-medium text-slate-700 dark:text-slate-300" title={item.fileName}>
        {item.fileName}
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-700/50">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">Original</p>
          <img
            src={item.originalUrl}
            alt={item.fileName}
            className="h-24 w-full object-contain"
          />
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-700/50">
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">WebP</p>
          {item.converting ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-500" />
            </div>
          ) : item.error ? (
            <div className="flex h-24 items-center justify-center text-xs text-red-600 dark:text-red-400">
              {item.error}
            </div>
          ) : item.webpUrl ? (
            <img
              src={item.webpUrl}
              alt={`${item.fileName} WebP`}
              className="h-24 w-full object-contain"
            />
          ) : (
            <div className="flex h-24 items-center justify-center text-xs text-slate-400">—</div>
          )}
        </div>
      </div>
      <dl className="mb-4 space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex justify-between">
          <dt>Dimensiones</dt>
          <dd>{item.width} × {item.height}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Original</dt>
          <dd>{formatBytes(item.originalSize)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>WebP</dt>
          <dd>{item.webpSize != null ? formatBytes(item.webpSize) : "—"}</dd>
        </div>
        {reduction != null && (
          <div className="flex justify-between font-medium text-emerald-600 dark:text-emerald-400">
            <dt>Reducción</dt>
            <dd>−{reduction}%</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={!item.webpUrl || item.converting}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Descargar
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}
