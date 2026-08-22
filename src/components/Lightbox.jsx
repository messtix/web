import { useEffect, useRef, useState } from 'react';

const ZOOM_SCALE = 2.5;

export default function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const [zoomed, setZoomed] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    setZoomed(false);
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
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function toggleZoom(e) {
    e.stopPropagation();
    setZoomed((z) => !z);
    setPos({ x: 0, y: 0 });
  }

  function onPointerDown(e) {
    if (!zoomed) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  }

  function onPointerMove(e) {
    if (!zoomed || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }

  function onPointerUp() {
    dragRef.current = null;
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

      {hasPrev && (
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
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            className="lightbox-img"
            src={item.img}
            alt={item.alt}
            onClick={toggleZoom}
            style={
              zoomed
                ? {
                    transform: `scale(${ZOOM_SCALE}) translate(${pos.x / ZOOM_SCALE}px, ${pos.y / ZOOM_SCALE}px)`,
                    cursor: 'zoom-out',
                  }
                : { cursor: 'zoom-in' }
            }
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'flex';
            }}
          />
        </div>
        <div className="lightbox-panel">{item.alt}</div>
        <p className="lightbox-caption">
          {item.alt}
          <span className="lightbox-count">{index + 1} / {items.length}</span>
        </p>
      </div>

      {hasNext && (
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
