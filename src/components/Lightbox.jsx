import { useEffect } from 'react';

export default function Lightbox({ items, index, onClose, onNavigate }) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

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
        <img
          className="lightbox-img"
          src={item.img}
          alt={item.alt}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextSibling.style.display = 'flex';
          }}
        />
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
