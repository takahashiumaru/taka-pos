"use client";

import * as React from "react";
import { ImagePlus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_BYTES = 600_000; // ~600 KB raw, will compress further

async function fileToCompressedDataUrl(
  file: File,
  maxDim = 600,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Change to image/png to support transparency
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  className,
}: {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > MAX_BYTES * 10) {
      toast.error("Gambar terlalu besar (max 6 MB sebelum kompresi)");
      return;
    }
    setLoading(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
      toast.success("Gambar terupload");
    } catch (err) {
      toast.error((err as Error).message || "Gagal upload gambar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-dashed p-3 transition-colors",
        dragOver && "border-primary bg-primary/5",
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <ImagePlus className="h-7 w-7 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-medium">Gambar produk</p>
        <p className="text-xs text-muted-foreground">
          JPG / PNG / WebP. Otomatis dikompres ke ~600px.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            {loading ? "Mengupload…" : value ? "Ganti gambar" : "Pilih gambar"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
            >
              <X className="h-3.5 w-3.5" /> Hapus
            </Button>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
