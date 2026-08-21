import { useState } from 'react';
import SocialLinks from '../components/SocialLinks';
import useDocumentTitle from '../hooks/useDocumentTitle';

export default function Contact() {
  useDocumentTitle('Contacto | María Sánchez - Messtix');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [startedAt] = useState(() => Date.now());

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');

    const form = e.target;
    const data = new FormData(form);
    data.set('started_at', String(startedAt));

    try {
      const res = await fetch('/contact.php', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        setStatus('sent');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
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
            {status === 'sent' ? (
              <p>Gracias por tu mensaje. Te responderé pronto.</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="honeypot-field" aria-hidden="true">
                  <label htmlFor="company">No llenar este campo</label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    tabIndex="-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="name">Nombre Completo</label>
                  <input id="name" name="name" type="text" required maxLength="100" placeholder="Tu nombre completo" />
                </div>
                <div>
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" name="email" type="email" required maxLength="150" placeholder="tucorreo@ejemplo.com" />
                </div>
                <div>
                  <label htmlFor="message">Mensaje</label>
                  <textarea id="message" name="message" rows="6" required maxLength="5000" placeholder="Cuéntame sobre tu proyecto"></textarea>
                </div>
                <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Enviando…' : 'Enviar Mensaje'}
                </button>
                {status === 'error' && (
                  <p style={{ color: 'var(--vino)', margin: 0 }}>
                    Hubo un problema al enviar tu mensaje. Intenta de nuevo o escríbeme directo a{' '}
                    <a href="mailto:info@messtix.com">info@messtix.com</a>.
                  </p>
                )}
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
              <h4>Asesoría Gratuita</h4>
              <a href="https://calendly.com/messtix" target="_blank" rel="noreferrer">
                Agendar en Calendly
              </a>
            </div>
            <div className="row">
              <h4>Redes Sociales</h4>
              <SocialLinks />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
