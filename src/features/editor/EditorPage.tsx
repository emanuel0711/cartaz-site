import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Database,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Lock,
  QrCode,
  Redo2,
  Save,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PosterCanvas } from "../../components/PosterCanvas";
import { sampleProducts } from "../../domain/fixtures";
import {
  FIELD_LABELS,
  FIELD_TOKENS,
  PAGE_SIZES,
  type DesignElement,
  type DynamicField,
} from "../../domain/types";
import { en } from "../../i18n/en";
import { newId } from "../../lib/id";
import { useAppStore } from "../../store/appStore";

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const stored = useAppStore((state) =>
    state.designs.find((design) => design.id === id),
  );
  const saveDesign = useAppStore((state) => state.updateDesign);
  const [design, setDesign] = useState(stored);
  const [selected, setSelected] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [saved, setSaved] = useState(true);
  const imageInput = useRef<HTMLInputElement>(null);
  const element = design?.elements.find((item) => item.id === selected);
  useEffect(() => {
    if (!design || !id || saved) return;
    const timer = setTimeout(() => {
      saveDesign(id, design);
      setSaved(true);
    }, 650);
    return () => clearTimeout(timer);
  }, [design, id, saveDesign, saved]);
  const pageSize = useMemo(
    () =>
      Object.entries(PAGE_SIZES).find(
        ([, size]) =>
          size[0] === design?.widthMm && size[1] === design?.heightMm,
      )?.[0] || "Custom",
    [design],
  );
  if (!design)
    return (
      <div className="empty-state">
        <h2>{en.editor.notFound}</h2>
        <button className="primary-button" onClick={() => navigate("/designs")}>
          {en.editor.backToDesigns}
        </button>
      </div>
    );

  function change(update: Partial<typeof design>) {
    setDesign((current) => (current ? { ...current, ...update } : current));
    setSaved(false);
  }
  function updateElement(elementId: string, update: Partial<DesignElement>) {
    change({
      elements: design!.elements.map((item) =>
        item.id === elementId ? { ...item, ...update } : item,
      ),
    });
  }
  function add(
    kind: "text" | "dynamic" | "shape" | "qr",
    field?: DynamicField,
  ) {
    const item: DesignElement = {
      id: newId(),
      kind,
      name: field
        ? FIELD_LABELS[field]
        : kind === "text"
          ? en.editor.text
          : kind === "qr"
            ? en.editor.qr
            : en.editor.shape,
      x: 25,
      y: 30,
      width: kind === "qr" ? 42 : 120,
      height: kind === "shape" ? 30 : kind === "qr" ? 42 : 36,
      rotation: 0,
      text: kind === "text" ? en.editor.newText : undefined,
      field,
      token: field ? FIELD_TOKENS[field] : undefined,
      fontFamily: "Impact",
      fontSize: 22,
      minFontSize: 10,
      fontWeight: 600,
      color: kind === "shape" ? design!.accentColor : "#171a17",
      backgroundColor: kind === "shape" ? design!.accentColor : undefined,
      align: "center",
      textFit: "shrink",
      priceStyle: field?.toLowerCase().includes("price")
        ? "reduced-cents"
        : "standard",
    };
    change({ elements: [...design!.elements, item] });
    setSelected(item.id);
  }
  async function addImage(file?: File) {
    if (!file) return;
    if (
      !/^(image\/png|image\/jpeg|image\/webp)$/.test(file.type) ||
      file.size > 5 * 1024 * 1024
    )
      return alert("Choose a PNG, JPEG, or WebP image up to 5 MB.");
    const source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = new window.Image();
    image.src = source;
    await image.decode();
    if (image.width > 8192 || image.height > 8192)
      return alert("Image dimensions must not exceed 8,192 × 8,192 pixels.");
    const item: DesignElement = {
      id: newId(),
      kind: "image",
      name: file.name,
      source,
      x: 25,
      y: 30,
      width: 80,
      height: 80,
      rotation: 0,
      fontFamily: "Impact",
      fontSize: 12,
      minFontSize: 8,
      fontWeight: 600,
      color: "#111111",
      align: "center",
      textFit: "shrink",
    };
    change({ elements: [...design!.elements, item] });
    setSelected(item.id);
  }
  function removeSelected() {
    if (!element) return;
    change({
      elements: design!.elements.filter((item) => item.id !== element.id),
    });
    setSelected(null);
  }
  function duplicateSelected() {
    if (!element) return;
    const copy = {
      ...element,
      id: newId(),
      name: `${element.name} copy`,
      x: element.x + 4,
      y: element.y + 4,
    };
    change({ elements: [...design!.elements, copy] });
    setSelected(copy.id);
  }
  function moveLayer(direction: -1 | 1) {
    if (!element) return;
    const items = [...design!.elements],
      index = items.findIndex((item) => item.id === element.id),
      next = Math.max(0, Math.min(items.length - 1, index + direction));
    items.splice(index, 1);
    items.splice(next, 0, element);
    change({ elements: items });
  }

  return (
    <div className="editor-page">
      <header className="editor-toolbar">
        <button
          className="icon-button"
          onClick={() => navigate("/designs")}
          aria-label={en.editor.backToDesigns}
          title={en.editor.backToDesigns}
        >
          <ArrowLeft size={20} />
        </button>
        <input
          className="editor-title"
          value={design.name}
          onChange={(event) => change({ name: event.target.value })}
          aria-label="Design name"
        />
        <span className={`save-state ${saved ? "is-saved" : ""}`}>
          <Save size={15} /> {saved ? en.common.saved : en.common.saving}
        </span>
        <div className="toolbar-spacer" />
        <button
          className="icon-button"
          disabled
          title="Undo history is not available yet"
          aria-label="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          className="icon-button"
          disabled
          title="Redo history is not available yet"
          aria-label="Redo"
        >
          <Redo2 size={18} />
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            setSampleIndex((sampleIndex + 1) % sampleProducts.length)
          }
        >
          Sample {sampleIndex + 1}/{sampleProducts.length}
        </button>
      </header>
      <aside className="editor-left">
        <h3>{en.editor.add}</h3>
        <button onClick={() => add("text")}>
          <Type size={20} /> {en.editor.text}
        </button>
        <button onClick={() => imageInput.current?.click()}>
          <Image size={20} /> {en.editor.image}
        </button>
        <input
          ref={imageInput}
          hidden
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => void addImage(event.target.files?.[0])}
        />
        <button onClick={() => add("shape")}>
          <Square size={20} /> {en.editor.shape}
        </button>
        <button onClick={() => add("qr", "ean")}>
          <QrCode size={20} /> {en.editor.qr}
        </button>
        <h3>{en.editor.data}</h3>
        <p className="editor-help">{en.editor.placeholderHelp}</p>
        <div className="field-chips">
          {(Object.keys(FIELD_LABELS) as DynamicField[]).map((field) => (
            <button key={field} onClick={() => add("dynamic", field)}>
              <Database size={14} /> {FIELD_TOKENS[field]}
            </button>
          ))}
        </div>
      </aside>
      <main className="editor-workspace">
        <div className="page-controls">
          <label>
            {en.editor.pageSize}
            <select
              value={pageSize}
              onChange={(event) => {
                const size =
                  PAGE_SIZES[event.target.value as keyof typeof PAGE_SIZES];
                if (size) change({ widthMm: size[0], heightMm: size[1] });
              }}
            >
              <option>Custom</option>
              {Object.keys(PAGE_SIZES).map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <label>
            {en.editor.orientation}
            <select
              value={design.orientation}
              onChange={(event) => {
                const orientation = event.target.value as
                  "portrait" | "landscape";
                change({
                  orientation,
                  widthMm:
                    orientation === design.orientation
                      ? design.widthMm
                      : design.heightMm,
                  heightMm:
                    orientation === design.orientation
                      ? design.heightMm
                      : design.widthMm,
                });
              }}
            >
              <option value="portrait">{en.editor.portrait}</option>
              <option value="landscape">{en.editor.landscape}</option>
            </select>
          </label>
          <span>
            {design.widthMm} × {design.heightMm} mm
          </span>
        </div>
        <PosterCanvas
          design={design}
          product={sampleProducts[sampleIndex]}
          selectedId={selected}
          onSelect={setSelected}
          onElementMove={(elementId, x, y) =>
            updateElement(elementId, { x, y })
          }
          editorMode
        />
      </main>
      <aside className="editor-right">
        {element ? (
          <>
            <div className="panel-heading">
              <h3>{element.name}</h3>
              <span>{element.kind}</span>
            </div>
            {element.kind === "text" && (
              <label>
                {en.editor.text}
                <input
                  value={element.text || ""}
                  onChange={(event) =>
                    updateElement(element.id, { text: event.target.value })
                  }
                />
              </label>
            )}
            <div className="property-grid">
              <label>
                X (mm)
                <input
                  type="number"
                  value={Math.round(element.x)}
                  onChange={(event) =>
                    updateElement(element.id, { x: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Y (mm)
                <input
                  type="number"
                  value={Math.round(element.y)}
                  onChange={(event) =>
                    updateElement(element.id, { y: Number(event.target.value) })
                  }
                />
              </label>
              <label>
                Width
                <input
                  type="number"
                  min="1"
                  value={Math.round(element.width)}
                  onChange={(event) =>
                    updateElement(element.id, {
                      width: Math.max(1, Number(event.target.value)),
                    })
                  }
                />
              </label>
              <label>
                Height
                <input
                  type="number"
                  min="1"
                  value={Math.round(element.height)}
                  onChange={(event) =>
                    updateElement(element.id, {
                      height: Math.max(1, Number(event.target.value)),
                    })
                  }
                />
              </label>
            </div>
            {!["shape", "image", "qr"].includes(element.kind) && (
              <>
                <label>
                  {en.editor.font}
                  <select
                    value={element.fontFamily || "Impact"}
                    onChange={(event) =>
                      updateElement(element.id, {
                        fontFamily: event.target
                          .value as DesignElement["fontFamily"],
                      })
                    }
                  >
                    <option>Impact</option>
                    <option>Anton</option>
                    <option>Helvetica</option>
                  </select>
                </label>
                <label>
                  Font size
                  <input
                    type="number"
                    min="6"
                    max="500"
                    value={element.fontSize}
                    onChange={(event) =>
                      updateElement(element.id, {
                        fontSize: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Text fitting
                  <select
                    value={element.textFit}
                    onChange={(event) =>
                      updateElement(element.id, {
                        textFit: event.target.value as DesignElement["textFit"],
                      })
                    }
                  >
                    <option value="shrink">Shrink to fit</option>
                    <option value="wrap">Wrap lines</option>
                    <option value="truncate">Truncate</option>
                  </select>
                </label>
                <div className="button-group">
                  <button
                    className={element.align === "left" ? "is-active" : ""}
                    onClick={() => updateElement(element.id, { align: "left" })}
                    aria-label="Align left"
                  >
                    <AlignLeft size={18} />
                  </button>
                  <button
                    className={element.align === "center" ? "is-active" : ""}
                    onClick={() =>
                      updateElement(element.id, { align: "center" })
                    }
                    aria-label="Align center"
                  >
                    <AlignCenter size={18} />
                  </button>
                  <button
                    className={element.align === "right" ? "is-active" : ""}
                    onClick={() =>
                      updateElement(element.id, { align: "right" })
                    }
                    aria-label="Align right"
                  >
                    <AlignRight size={18} />
                  </button>
                </div>
              </>
            )}
            <label>
              Color
              <input
                type="color"
                value={
                  element.kind === "shape"
                    ? element.backgroundColor || element.color
                    : element.color
                }
                onChange={(event) =>
                  updateElement(
                    element.id,
                    element.kind === "shape"
                      ? {
                          backgroundColor: event.target.value,
                          color: event.target.value,
                        }
                      : { color: event.target.value },
                  )
                }
              />
            </label>
            <div className="button-group">
              <button
                onClick={duplicateSelected}
                aria-label="Duplicate element"
                title="Duplicate element"
              >
                <Copy size={17} />
              </button>
              <button
                onClick={() => moveLayer(1)}
                aria-label="Bring forward"
                title="Bring forward"
              >
                <ArrowUp size={17} />
              </button>
              <button
                onClick={() => moveLayer(-1)}
                aria-label="Send backward"
                title="Send backward"
              >
                <ArrowDown size={17} />
              </button>
              <button
                className="archive-button"
                onClick={removeSelected}
                aria-label="Delete element"
                title="Delete element"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </>
        ) : (
          <div className="context-empty">
            <GripVertical size={28} />
            <h3>{en.editor.select}</h3>
            <p>{en.editor.selectHelp}</p>
          </div>
        )}
        <div className="layers-panel">
          <h3>{en.editor.layers}</h3>
          {[...design.elements].reverse().map((item) => (
            <div
              className={`layer-row ${selected === item.id ? "is-active" : ""}`}
              key={item.id}
              onClick={() => setSelected(item.id)}
            >
              <GripVertical size={15} />
              <span>{item.name}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  updateElement(item.id, { locked: !item.locked });
                }}
                aria-label={item.locked ? "Unlock layer" : "Lock layer"}
              >
                {item.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  updateElement(item.id, { visible: item.visible === false });
                }}
                aria-label={
                  item.visible === false ? "Show layer" : "Hide layer"
                }
              >
                {item.visible === false ? (
                  <EyeOff size={14} />
                ) : (
                  <Eye size={14} />
                )}
              </button>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
