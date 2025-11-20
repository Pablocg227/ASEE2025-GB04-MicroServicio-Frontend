import React, { useState } from "react";
import EditModal from "./EditModal";
import { deleteSong } from "../../services/musicApi";
import "../../styles/SongList.css";
import { fileURL } from "../../utils/helpers";

const SongList = ({ songs, onUpdate, showAlbumColumn = true }) => {
  const [editingSong, setEditingSong] = useState(null);

  const handleDelete = async (songId) => {
    if (
      !window.confirm("¿Estás seguro de que quieres eliminar esta canción?")
    ) {
      return;
    }
    try {
      await deleteSong(songId);
      alert("Canción eliminada correctamente");
      onUpdate();
    } catch (error) {
      console.error("Error deleting song:", error);
      alert("Error al eliminar la canción");
    }
  };

  if (songs.length === 0) {
    return <div className="no-content">No tienes canciones todavía</div>;
  }

  return (
    <div className="content-grid">
      {songs.map((song) => (
        <div key={song.id} className="content-card">
          <img
            src={fileURL(song.imgPortada) || "/placeholder-song.png"}
            alt={song.nomCancion}
            className="content-image"
          />
          <div className="content-info">
            <h3>{song.nomCancion}</h3>
            <p className="content-detail">
              Fecha: {new Date(song.date).toLocaleDateString()}
            </p>
            <p className="content-detail">Precio: {song.precio.toFixed(2)}€</p>
            <p className="content-detail">
              Géneros: {song.genres.join(", ") || "Sin género"}
            </p>
            <p className="content-detail">
              👁️ {song.numVisualizaciones} | ❤️ {song.numLikes}
            </p>
            <p className="content-detail">
              💰 Ingresos: {song.numIngresos.toFixed(2)}€
            </p>
            {showAlbumColumn && song.idAlbum && (
              <p className="content-detail">Álbum ID: {song.idAlbum}</p>
            )}
            <div className="content-actions">
              <button className="btn-edit" onClick={() => setEditingSong(song)}>
                ✏️ Modificar
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(song.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingSong && (
        <EditModal
          type="song"
          data={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={() => {
            setEditingSong(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default SongList;
