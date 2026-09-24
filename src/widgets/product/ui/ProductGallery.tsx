"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { ProductImageResponse } from "@/entities/product";
import { cn } from "@/shared/config";

interface ProductGalleryProps {
  images: ProductImageResponse[];
  productName: string;
}

export const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const sortedImages = images.slice().sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
  const [activeIdx, setActiveIdx] = useState(0);
  const currentImage = sortedImages[activeIdx] ?? sortedImages[0];

  return (
    <div>
      <div className="relative flex aspect-square sm:aspect-4/3 w-full items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-2 shadow-sm transition-all overflow-hidden group">
        {currentImage ? (
          <Image
            alt={productName}
            className="h-full w-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
            height={520}
            src={currentImage.url}
            width={650}
            priority
          />
        ) : (
          <span className="grid size-32 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
            <ImageOff size={48} />
          </span>
        )}

        {sortedImages.length > 1 ? (
          <>
            <button
              onClick={() => setActiveIdx((prev) => (prev > 0 ? prev - 1 : sortedImages.length - 1))}
              className="absolute top-1/2 left-4 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md backdrop-blur-md transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              type="button"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setActiveIdx((prev) => (prev < sortedImages.length - 1 ? prev + 1 : 0))}
              className="absolute top-1/2 right-4 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-md backdrop-blur-md transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              type="button"
              aria-label="Следующее фото"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}
      </div>

      {sortedImages.length > 1 ? (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {sortedImages.slice(0, 6).map((image, index) => (
            <button
              onClick={() => setActiveIdx(index)}
              className={cn(
                "flex size-18 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-1.5 transition-all",
                activeIdx === index
                  ? "border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                  : "border-slate-200 hover:border-slate-300",
              )}
              type="button"
              key={`${image.id}-${index}`}
            >
              <Image
                alt={`${productName} фото ${index + 1}`}
                className="h-full w-full object-cover rounded-lg"
                height={70}
                src={image.url}
                width={70}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
