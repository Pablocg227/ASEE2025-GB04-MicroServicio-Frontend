import React, { useState } from "react";
import EditModal from "./EditModal";
import ManageSongsModal from "./ManageSongsModal";
import { deleteAlbum } from "../../services/musicApi";
import { fileURL } from "../../utils/helpers";

const AlbumList = ({ albums, onUpdate }) => {
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [managingAlbum, setManagingAlbum] = useState(null);

  const handleDelete = async (albumId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este álbum?")) {
      return;
    }
    try {
      await deleteAlbum(albumId);
      alert("Álbum eliminado correctamente");
      onUpdate();
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Error al eliminar el álbum");
    }
  };

  if (albums.length === 0) {
    return <div className="no-content">No tienes álbumes todavía</div>;
  }

  return (
    <div className="content-grid">
      {albums.map((album) => (
        <div key={album.id} className="content-card">
          <img
            src={fileURL(album.imgPortada) || "/placeholder-album.png"}
            alt={album.titulo}
            className="content-image"
          />
          <div className="content-info">
            <h3>{album.titulo}</h3>
            <p className="content-detail">
              Fecha: {new Date(album.date).toLocaleDateString()}
            </p>
            <p className="content-detail">Precio: {album.precio.toFixed(2)}€</p>
            <p className="content-detail">
              Géneros: {album.genre.join(", ") || "Sin género"}
            </p>
            <p className="content-detail">
              Canciones: {album.canciones_ids.length}
            </p>
            <div className="content-actions">
              <button
                className="btn-edit"
                onClick={() => setEditingAlbum(album)}
              >
                ✏️ Modificar
              </button>
              <button
                className="btn-edit"
                onClick={() => setManagingAlbum(album)}
              >
                🎵 Canciones
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(album.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingAlbum && (
        <EditModal
          type="album"
          data={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSave={() => {
            setEditingAlbum(null);
            onUpdate();
          }}
        />
      )}

      {managingAlbum && (
        <ManageSongsModal
          album={managingAlbum}
          onClose={() => setManagingAlbum(null)}
          onUpdated={() => {
            setManagingAlbum(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default AlbumList;
