import { getFieldValue, priceParts } from "../domain/format";
import type { Design, DesignElement, Product } from "../domain/types";

function CanvasElement({ element, design, product, selected, onSelect, onMove }: { element: DesignElement; design: Design; product: Product; selected?: boolean; onSelect?: () => void; onMove?: (x: number, y: number) => void }) {
  if (element.visible === false) return null;
  const value = element.kind === "dynamic" && element.field ? getFieldValue(product, element.field) : element.text || "";
  const style: React.CSSProperties = {
    left: `${element.x / design.widthMm * 100}%`, top: `${element.y / design.heightMm * 100}%`,
    width: `${element.width / design.widthMm * 100}%`, height: `${element.height / design.heightMm * 100}%`,
    color: element.color, background: element.kind === "shape" ? (element.backgroundColor || element.color) : element.backgroundColor,
    fontSize: `clamp(${Math.max(8, element.minFontSize) / 5}px, ${element.fontSize / design.widthMm * 100}cqi, ${element.fontSize}px)`,
    fontWeight: element.fontWeight, textAlign: element.align, transform: `rotate(${element.rotation}deg)`,
    alignItems: element.align === "left" ? "flex-start" : element.align === "right" ? "flex-end" : "center",
  };
  function startDrag(event: React.PointerEvent) {
    if (!onMove || element.locked) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX, startY = event.clientY, originalX = element.x, originalY = element.y;
    const target = event.currentTarget as HTMLButtonElement;
    target.onpointermove = (move: PointerEvent) => {
      const rect = target.parentElement!.getBoundingClientRect();
      onMove(Math.max(0, Math.min(design.widthMm - element.width, originalX + (move.clientX - startX) / rect.width * design.widthMm)), Math.max(0, Math.min(design.heightMm - element.height, originalY + (move.clientY - startY) / rect.height * design.heightMm)));
    };
    target.onpointerup = () => { target.onpointermove = null; target.onpointerup = null; };
  }
  const reducedPrice = element.kind === "dynamic" && element.field && ["normalPrice", "promotionalPrice", "installmentValue", "bundlePrice"].includes(element.field) && element.priceStyle === "reduced-cents";
  let parts = { major: "", minor: "" };
  if (reducedPrice) {
    const values: Record<string, number | null> = { normalPrice: product.normalPriceCents, promotionalPrice: product.promotionalPriceCents, installmentValue: product.installmentValueCents, bundlePrice: product.bundlePriceCents };
    parts = priceParts(values[element.field!]);
  }
  return (
    <button type="button" className={`canvas-element fit-${element.textFit} ${selected ? "is-selected" : ""} kind-${element.kind}`} style={style} onClick={(event) => { event.stopPropagation(); onSelect?.(); }} onPointerDown={startDrag} aria-label={element.name}>
      {reducedPrice ? <span className="price-lockup"><strong>{parts.major}</strong><sup>{parts.minor}</sup></span> : value}
    </button>
  );
}

export function PosterCanvas({ design, product, selectedId, onSelect, onElementMove, compact = false }: { design: Design; product: Product; selectedId?: string | null; onSelect?: (id: string | null) => void; onElementMove?: (id: string, x: number, y: number) => void; compact?: boolean }) {
  return (
    <div className={`poster-stage ${compact ? "is-compact" : ""}`}>
      <div className="poster-page" style={{ aspectRatio: `${design.widthMm}/${design.heightMm}`, background: design.backgroundColor }} onClick={() => onSelect?.(null)}>
        {design.elements.map((element) => <CanvasElement key={element.id} element={element} design={design} product={product} selected={selectedId === element.id} onSelect={() => onSelect?.(element.id)} onMove={onElementMove ? (x, y) => onElementMove(element.id, x, y) : undefined} />)}
        {!compact && <div className="safe-area" aria-hidden="true" />}
      </div>
    </div>
  );
}
