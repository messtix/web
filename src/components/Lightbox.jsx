export default function Lightbox({ item, onClose }) {
  if (!item) return null;
  return (
    <div id="lightbox" onClick={onClose}>
      <div className="lightbox-panel">{item.alt}</div>
    </div>
  );
}
