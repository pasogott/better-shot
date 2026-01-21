export interface ForensicMetadataOptions {
  timestampUtc: string;
  userLabel: string;
}

const FONT_FAMILY =
  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";

export function appendForensicMetadata(
  sourceCanvas: HTMLCanvasElement,
  { timestampUtc, userLabel }: ForensicMetadataOptions
): HTMLCanvasElement {
  const footerPaddingX = 24;
  const footerPaddingY = 12;
  const lineGap = 4;
  const fontSize = 14;
  const lineHeight = 18;

  const footerHeight = footerPaddingY * 2 + lineHeight * 2 + lineGap;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height + footerHeight;

  const ctx = outputCanvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("Failed to get canvas context for forensic metadata");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw the original image
  ctx.drawImage(sourceCanvas, 0, 0);

  // Footer background
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, sourceCanvas.height, outputCanvas.width, footerHeight);

  // Separator line
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, sourceCanvas.height + 0.5);
  ctx.lineTo(outputCanvas.width, sourceCanvas.height + 0.5);
  ctx.stroke();

  // Text
  ctx.fillStyle = "#0f172a";
  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;

  const startX = footerPaddingX;
  const startY = sourceCanvas.height + footerPaddingY;

  ctx.fillText(`UTC: ${timestampUtc}`, startX, startY);
  ctx.fillText(`User: ${userLabel}`, startX, startY + lineHeight + lineGap);

  return outputCanvas;
}
