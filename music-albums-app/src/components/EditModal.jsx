import React, { useState } from 'react';
import { updateAlbum, updateSong } from '../services/api';
import '../styles/EditModal.css';

const EditModal = ({ type, data, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    titulo: type === 'album' ? (data.titulo || '') : (data.nomCancion || ''),
    date: (data.date || '').slice(0, 10),
    precio: data.precio ?? 0,
    imgPortada: data.imgPortada || '',
    genresText: (type === 'album' ? (data.genre || []) : (data.genres || [])).join(', ')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === 'album') {
        await updateAlbum(data.id, {
          titulo: formData.titulo,
          imgPortada: formData.imgPortada,
          genre: formData.genresText.split(',').map(s => s.trim()).filter(Boolean),
          date: formData.date,
          precio: parseFloat(formData.precio)
        });
      } else {
        await updateSong(data.id, {
          titulo: formData.titulo, // se mapeará a nomCancion en el servicio
          imgPortada: formData.imgPortada,
          genres: formData.genresText.split(',').map(s => s.trim()).filter(Boolean),
          date: formData.date,
          precio: parseFloat(formData.precio),
          idAlbum: data.idAlbum ?? null
        });
      }
      alert(`${type === 'album' ? 'Álbum' : 'Canción'} actualizado correctamente`);
      onSave();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      alert(`Error al actualizar: ${msg}`);
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Editar {type === 'album' ? 'Álbum' : 'Canción'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => setFormData({...formData, titulo: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de lanzamiento</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Precio (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={e => setFormData({...formData, precio: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Géneros (separados por coma)</label>
            <input
              type="text"
              value={formData.genresText}
              onChange={e => setFormData({...formData, genresText: e.target.value})}
              placeholder="Rock, Pop, Jazz"
            />
          </div>

          <div className="form-group">
            <label>URL de la portada</label>
            <input
              type="text"
              value={formData.imgPortada}
              onChange={e => setFormData({...formData, imgPortada: e.target.value})}
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;