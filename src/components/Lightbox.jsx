import { useEffect, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const CLICK_SCALE = 2.5;
const WHEEL_STEP = 0.35;
const DRAG_THRESHOLD = 6;

export default function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const imgRef = useRef(null);
  const zoomed = scale > 1;

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [index]);

  function goPrev() {
    if (hasPrev) onNavigate(index - 1);
  }

  function goNext() {
    if (hasNext) onNavigate(index + 1);
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && scale === 1) goPrev();
      if (e.key === 'ArrowRight' && scale === 1) goNext();
      if (e.key === '+' || e.key === '=') setScale((s) => clampScale(s + WHEEL_STEP));
      if (e.key === '-') setScale((s) => clampScale(s - WHEEL_STEP));
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function clampScale(s) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
  }

  function clampPos(nextPos, s) {
    const el = imgRef.current;
    if (!el || s <= 1) return { x: 0, y: 0 };
    const maxX = (el.offsetWidth * (s - 1)) / 2;
    const maxY = (el.offsetHeight * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, nextPos.x)),
      y: Math.min(maxY, Math.max(-maxY, nextPos.y)),
    };
  }

  function applyScale(nextScale) {
    const s = clampScale(nextScale);
    setScale(s);
    setPos((p) => (s === 1 ? { x: 0, y: 0 } : clampPos(p, s)));
  }

  function onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    applyScale(scale - Math.sign(e.deltaY) * WHEEL_STEP);
  }

  function onImgClick(e) {
    e.stopPropagation();
    if (dragRef.current && dragRef.current.moved) return; // was a drag, not a click
    applyScale(scale > 1 ? 1 : CLICK_SCALE);
  }

  function onPointerDown(e) {
    if (!zoomed) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  }

  function onPointerMove(e) {
    if (!zoomed || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
    }
    setPos(clampPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy }, scale));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function zoomIn(e) {
    e.stopPropagation();
    applyScale(scale + WHEEL_STEP);
  }

  function zoomOut(e) {
    e.stopPropagation();
    applyScale(scale - WHEEL_STEP);
  }

  function resetZoom(e) {
    e.stopPropagation();
    applyScale(1);
  }

  if (!item) return null;

  return (
    <div id="lightbox" onClick={onClose}>
      <button
        type="button"
        className="lightbox-close"
        aria-label="Cerrar"
        onClick={onClose}
      >
        ×
      </button>

      {hasPrev && !zoomed && (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Anterior"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          ‹
        </button>
      )}

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <div
          className={`lightbox-img-wrap${zoomed ? ' is-zoomed' : ''}`}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            className="lightbox-img"
            src={item.img}
            alt={item.alt}
            draggable={false}
            onClick={onImgClick}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              cursor: zoomed ? 'grab' : 'zoom-in',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        </div>

        {zoomed && (
          <div className="lightbox-zoom-controls" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={zoomOut} aria-label="Alejar">−</button>
            <button type="button" onClick={resetZoom} aria-label="Restablecer zoom">{Math.round(scale * 100)}%</button>
            <button type="button" onClick={zoomIn} aria-label="Acercar">+</button>
          </div>
        )}

        <div className="lightbox-panel">{item.alt}</div>
        <p className="lightbox-caption">
          {item.alt}
          <span className="lightbox-count">{index + 1} / {items.length}</span>
        </p>
      </div>

      {hasNext && !zoomed && (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Siguiente"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
