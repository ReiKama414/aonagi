"use client";

import { forwardRef } from "react";

interface AssetSrc {
  webp: string;
  png: string;
}

interface PictureImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: AssetSrc;
}

/**
 * Decorative layer image: WebP as the delivered format, PNG master as the
 * fallback for browsers without WebP support. Never interactive, never
 * carries meaning on its own, so it stays out of the accessibility tree.
 */
const PictureImg = forwardRef<HTMLImageElement, PictureImgProps>(
  ({ src, style, className, draggable, ...rest }, ref) => (
    <picture>
      <source srcSet={src.webp} type="image/webp" />
      <img
        ref={ref}
        src={src.png}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={className}
        style={style}
        {...rest}
      />
    </picture>
  )
);

PictureImg.displayName = "PictureImg";

export default PictureImg;
