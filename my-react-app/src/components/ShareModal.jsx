import React, { useState } from 'react';
import '../styles/ShareModal.css'; // Ahora crearemos este CSS

const ShareModal = ({ isOpen, onClose, title, url }) => {
    const [copySuccess, setCopySuccess] = useState('');

    if (!isOpen) return null;

    // Codificamos los textos para URL
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    // Links de compartir
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${title} ${url}`);
            setCopySuccess('¡Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Error al copiar');
        }
    };

    return (
        <div className="share-modal-overlay" onClick={onClose}>
            <div className="share-modal-content" onClick={e => e.stopPropagation()}>
                <div className="share-header">
                    <h3>Compartir</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <p className="share-preview">"{title}"</p>

                <div className="share-buttons">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-social whatsapp">
                        WhatsApp
                    </a>
                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="btn-social twitter">
                        X (Twitter)
                    </a>
                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-social facebook">
                        Facebook
                    </a>
                </div>

                <div className="copy-link-section">
                    <button className="btn-copy" onClick={handleCopy}>
                        🔗 {copySuccess || 'Copiar enlace'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;