import { useState } from 'react';

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">Contacto</span>
          <h1>Hablemos de tu Proyecto</h1>
          <p className="section-lead">
            Cuéntame qué necesitas y te responderé a la brevedad para agendar una asesoría.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div>
            {sent ? (
              <p>Gracias por tu mensaje. Te responderé pronto.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name">Nombre</label>
                  <input id="name" name="name" type="text" required placeholder="Tu nombre" />
                </div>
                <div>
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" name="email" type="email" required placeholder="tucorreo@ejemplo.com" />
                </div>
                <div>
                  <label htmlFor="message">Mensaje</label>
                  <textarea id="message" name="message" rows="6" required placeholder="Cuéntame sobre tu proyecto"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Enviar Mensaje</button>
              </form>
            )}
          </div>
          <div className="contact-info-card">
            <h4>Información de Contacto</h4>
            <div className="row">
              <h4>Correo</h4>
              <a href="mailto:info@messtix.com">info@messtix.com</a>
            </div>
            <div className="row">
              <h4>WhatsApp</h4>
              <a href="https://wa.me/584246383453" target="_blank" rel="noreferrer">
                +58 424 6383453
              </a>
            </div>
            <div className="row">
              <h4>Teléfono</h4>
              <a href="tel:+584246383453">+58 424 6383453</a>
            </div>
            <div className="row">
              <h4>Asesoría Gratuita</h4>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer">
                Agendar en Calendly
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
