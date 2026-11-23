import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

export const ImageSlider = ({
  images = [],
  className = "",
  fitClass = "object-cover",
  onImageClick,
  initialIndex = 0,
}) => {
  const validImages = Array.isArray(images)
    ? images
        .map((img) => (typeof img === "string" ? { url: img } : img))
        .filter((img) => Boolean(img?.url))
    : [];

  const total = validImages.length;
  const [currentIndex, setCurrentIndex] = useState(
    initialIndex >= 0 && initialIndex < total ? initialIndex : 0
  );

  useEffect(() => {
    if (typeof initialIndex === "number" && initialIndex >= 0 && initialIndex < total) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, total]);

  const touchStartX = useRef(null);

  const goPrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  // With 0 images show neutral placeholder
  if (total === 0) {
    return (
      <div
        className={`relative flex items-center justify-center bg-gray-100 text-gray-400 dark:bg-neutral-800 dark:text-neutral-500 ${className}`}
      >
        <ImageIcon className="h-10 w-10 opacity-40" />
      </div>
    );
  }

  // With 1 image hide controls
  if (total === 1) {
    return (
      <div
        className={`group relative overflow-hidden bg-black/5 dark:bg-neutral-900 ${className}`}
        onClick={() => onImageClick && onImageClick(0)}
        role={onImageClick ? "button" : undefined}
        tabIndex={onImageClick ? 0 : undefined}
      >
        <img
          src={validImages[0].url}
          alt="Unit"
          className={`h-full w-full ${fitClass}`}
        />
      </div>
    );
  }

  // Multi-image slider with prev/next, counter, dots, touch swipe, keyboard arrows
  return (
    <div
      role="region"
      aria-label="Image Slider"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`group relative overflow-hidden bg-black/10 outline-none dark:bg-neutral-900 ${className}`}
    >
      <img
        src={validImages[currentIndex]?.url}
        alt={`Unit image ${currentIndex + 1} of ${total}`}
        className={`h-full w-full ${fitClass} cursor-pointer transition-opacity duration-200`}
        onClick={() => onImageClick && onImageClick(currentIndex)}
      />

      {/* Prev button */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous image"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-90 backdrop-blur-sm transition hover:bg-black hover:opacity-100 focus:outline-none"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Next button */}
      <button
        type="button"
        onClick={goNext}
        aria-label="Next image"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white opacity-90 backdrop-blur-sm transition hover:bg-black hover:opacity-100 focus:outline-none"
      >
        <ChevronRight size={18} />
      </button>

      {/* 2 / 5 counter */}
      <div className="pointer-events-none absolute right-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
        {currentIndex + 1} / {total}
      </div>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {validImages.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIndex
                ? "w-4 bg-yellow-400"
                : "w-1.5 bg-white/70 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
