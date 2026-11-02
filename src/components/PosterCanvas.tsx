import { getFieldValue, priceParts } from "../domain/format";
import {
  FIELD_TOKENS,
  type Design,
  type DesignElement,
  type Product,
} from "../domain/types";
import { fitTextSize } from "../domain/textLayout";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";

function CanvasElement({
  element,
  design,
  product,
  selected,
  onSelect,
  onMove,
  editorMode,
}: {
  element: DesignElement;
  design: Design;
  product: Product;
  selected?: boolean;
  onSelect?: () => void;
  onMove?: (x: number, y: number) => void;
  editorMode?: boolean;
}) {
  if (element.visible === false) return null;
  const value =
    editorMode && element.kind === "dynamic"
      ? element.token ||
        (element.field ? FIELD_TOKENS[element.field] : element.name)
      : element.kind === "dynamic" && element.field
        ? getFieldValue(product, element.field)
        : element.text || "";
  const [qrSource, setQrSource] = useState("");
  useEffect(() => {
    if (element.kind === "qr")
      void QRCode.toDataURL(value || " ", {
        margin: 0,
        width: 512,
        errorCorrectionLevel: "M",
      }).then(setQrSource);
  }, [element.kind, value]);
  const fittedSize = useMemo(() => {
    if (
      element.kind === "shape" ||
      element.kind === "image" ||
      element.kind === "qr"
    )
      return element.fontSize;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return element.fontSize;
    const pagePixels = Math.min(900, window.innerWidth - 64);
    const boxPixels = (element.width / design.widthMm) * pagePixels;
    return fitTextSize(
      value,
      element.fontSize,
      element.minFontSize,
      boxPixels,
      (text, size) => {
      const family = element.fontFamily === "Impact" ? (document.fonts.check('12px "Impact Uploaded"') ? '"Impact Uploaded"' : "Anton") : "sans-serif";
      context.font = `${element.fontWeight} ${size}px ${family}`;
        return context.measureText(text).width;
      },
    );
  }, [design.widthMm, element, value]);
  const style: React.CSSProperties = {
    left: `${(element.x / design.widthMm) * 100}%`,
    top: `${(element.y / design.heightMm) * 100}%`,
    width: `${(element.width / design.widthMm) * 100}%`,
    height: `${(element.height / design.heightMm) * 100}%`,
    color: element.color,
    background:
      element.kind === "shape"
        ? element.backgroundColor || element.color
        : element.backgroundColor,
    fontSize: `${fittedSize}px`,
    fontFamily:
      element.fontFamily === "Impact" ? "var(--poster-impact)" : "inherit",
    fontWeight: element.fontWeight,
    textAlign: element.align,
    transform: `rotate(${element.rotation}deg)`,
    alignItems:
      element.align === "left"
        ? "flex-start"
        : element.align === "right"
          ? "flex-end"
          : "center",
  };
  function startDrag(event: React.PointerEvent) {
    if (!onMove || element.locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX,
      startY = event.clientY,
      originalX = element.x,
      originalY = element.y;
    const target = event.currentTarget as HTMLButtonElement;
    target.onpointermove = (move: PointerEvent) => {
      const rect = target.parentElement!.getBoundingClientRect();
      onMove(
        Math.max(
          0,
          Math.min(
            design.widthMm - element.width,
            originalX + ((move.clientX - startX) / rect.width) * design.widthMm,
          ),
        ),
        Math.max(
          0,
          Math.min(
            design.heightMm - element.height,
            originalY +
              ((move.clientY - startY) / rect.height) * design.heightMm,
          ),
        ),
      );
    };
    target.onpointerup = () => {
      target.onpointermove = null;
      target.onpointerup = null;
    };
  }
  const reducedPrice =
    element.kind === "dynamic" &&
    element.field &&
    [
      "normalPrice",
      "promotionalPrice",
      "installmentValue",
      "bundlePrice",
    ].includes(element.field) &&
    element.priceStyle === "reduced-cents";
  let parts = { major: "", minor: "" };
  if (reducedPrice) {
    const values: Record<string, number | null> = {
      normalPrice: product.normalPriceCents,
      promotionalPrice: product.promotionalPriceCents,
      installmentValue: product.installmentValueCents,
      bundlePrice: product.bundlePriceCents,
    };
    parts = priceParts(values[element.field!]);
  }
  return (
    <button
      type="button"
      className={`canvas-element fit-${element.textFit} ${selected ? "is-selected" : ""} kind-${element.kind}`}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
      onPointerDown={startDrag}
      aria-label={element.name}
    >
      {element.kind === "image" && element.source ? (
        <img src={element.source} alt="" />
      ) : element.kind === "qr" && qrSource ? (
        <img src={qrSource} alt={`QR code for ${value}`} />
      ) : reducedPrice && !editorMode ? (
        <span className="price-lockup">
          <strong>{parts.major}</strong>
          <sup>{parts.minor}</sup>
        </span>
      ) : editorMode && element.kind === "dynamic" ? (
        <span className="placeholder-chip">{value}</span>
      ) : (
        value
      )}
    </button>
  );
}

export function PosterCanvas({
  design,
  product,
  selectedId,
  onSelect,
  onElementMove,
  compact = false,
  editorMode = false,
}: {
  design: Design;
  product: Product;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onElementMove?: (id: string, x: number, y: number) => void;
  compact?: boolean;
  editorMode?: boolean;
}) {
  return (
    <div className={`poster-stage ${compact ? "is-compact" : ""}`}>
      <div
        className="poster-page"
        style={{
          aspectRatio: `${design.widthMm}/${design.heightMm}`,
          backgroundColor: design.backgroundColor,
          backgroundImage: design.backgroundImageDataUrl
            ? `url(${design.backgroundImageDataUrl})`
            : undefined,
          backgroundSize: "100% 100%",
        }}
        onClick={() => onSelect?.(null)}
      >
        {design.elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            design={design}
            product={product}
            selected={selectedId === element.id}
            onSelect={() => onSelect?.(element.id)}
            onMove={
              onElementMove
                ? (x, y) => onElementMove(element.id, x, y)
                : undefined
            }
            editorMode={editorMode}
          />
        ))}
        {!compact && <div className="safe-area" aria-hidden="true" />}
      </div>
    </div>
  );
}
