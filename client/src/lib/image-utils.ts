/**
 * Compress and resize an image file before storing as base64.
 * PNGs are output as PNG to preserve transparency.
 * All other formats are output as JPEG at the given quality.
 */
export function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<string> {
  const { maxDim = 400, quality = 0.82 } = opts;
  const isPng = file.type === "image/png";

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height / width) * maxDim);
          width = maxDim;
        } else {
          width = Math.round((width / height) * maxDim);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      if (!isPng) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * For the league logo: must be exactly 500×500 px.
 * PNGs are output as PNG to preserve transparency.
 * Other formats are compressed to JPEG.
 */
export function compressLeagueImage(file: File): Promise<{ dataUrl: string; error?: string }> {
  const isPng = file.type === "image/png";

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width !== 500 || img.height !== 500) {
        return resolve({
          dataUrl: "",
          error: `Image must be exactly 500×500 px. Yours is ${img.width}×${img.height}.`,
        });
      }

      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 500;

      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve({ dataUrl: "", error: "Canvas context unavailable" });

      if (!isPng) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 500, 500);
      }

      ctx.drawImage(img, 0, 0, 500, 500);
      resolve({ dataUrl: isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.85) });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ dataUrl: "", error: "Failed to load image" });
    };

    img.src = url;
  });
}
