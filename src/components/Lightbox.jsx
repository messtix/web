export default function Lightbox({ item, onClose }) {
  if (!item) return null;
  return (
    <div id="lightbox" onClick={onClose}>
      <div className="lightbox-content">
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
        <p className="lightbox-caption">{item.alt}</p>
      </div>
    </div>
  );
}
