import React, { useEffect, useState } from 'react';
import { fetchArtistSongs, getArtistEmailFromToken, updateAlbum } from '../services/api';
import '../styles/EditModal.css';

const ManageSongsModal = ({ album, onClose, onUpdated }) => {
  const [allSongs, setAllSongs] = useState([]);
  const [selected, setSelected] = useState(new Set(album.canciones_ids || []));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const email = getArtistEmailFromToken();
        const songs = await fetchArtistSongs(email);
        setAllSongs(songs);
      } catch (e) {
        alert('Error cargando canciones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [album.id]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateAlbum(album.id, {
        ...album,
        canciones_ids: Array.from(selected)
      });
      alert('Canciones del álbum actualizadas');
      onUpdated();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Gestionar canciones del álbum</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <form onSubmit={handleSave} className="manage-songs-form">
            <div className="songs-select-list">
              {allSongs.map(song => (
                <label key={song.id} className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={selected.has(song.id)}
                    onChange={() => toggle(song.id)}
                  />
                  <span>{song.nomCancion} (ID {song.id})</span>
                </label>
              ))}
              {allSongs.length === 0 && <p>No hay canciones del artista.</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-save">Guardar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ManageSongsModal;