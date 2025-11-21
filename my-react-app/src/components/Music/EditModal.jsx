import React, { useState, useEffect } from "react";

import { updateAlbum, updateSong } from "../../services/musicApi";
import { fileURL } from "../../utils/helpers";
import "../../styles/EditModal.css";

const EditModal = ({ type, data, onClose, onSave }) => {
  const initialTitle =
    type === "album" ? data.titulo || "" : data.nomCancion || "";
  const initialDate = (data.date || "").slice(0, 10);
  const initialPrecio = data.precio ?? 0;
  const existingGenres =
    type === "album" ? data.genre || [] : data.genres || [];

  const [formData, setFormData] = useState({
    titulo: initialTitle,
    date: initialDate,
    precio: initialPrecio,
    imgPortada: data.imgPortada || "",
  });

  // fichero de portada seleccionada (si el usuario cambia la imagen)
  const [coverFile, setCoverFile] = useState(null);

  const [uploadError, setUploadError] = useState("");

  const [allGenres, setAllGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(
    existingGenres.map((g) => String(g).trim()),
  );

  useEffect(() => {
    // Obtener lista de géneros desde la API (incluye token si existe)
    const token = localStorage.getItem("authToken");
    fetch("http://127.0.0.1:8080/api/generos", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar géneros");
        return res.json();
      })
      .then((list) => {
        // list puede ser array de strings o de objetos {id,nombre}
        setAllGenres(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Error cargando géneros:", err);
        setAllGenres([]);
      });
  }, []);

  useEffect(() => {
    // Si cambia el data al reabrir modal, actualizar selección y formulario
    setSelectedGenres(
      (type === "album" ? data.genre || [] : data.genres || []).map((g) =>
        String(g).trim(),
      ),
    );
    setFormData({
      titulo: type === "album" ? data.titulo || "" : data.nomCancion || "",
      date: (data.date || "").slice(0, 10),
      precio: data.precio ?? 0,
      imgPortada: data.imgPortada || "",
    });
    setCoverFile(null);
    setUploadError("");
  }, [data, type]);

  const toggleGenre = (g) => {
    const name = typeof g === "string" ? g : (g.nombre ?? g);
    setSelectedGenres((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadError("");
    setCoverFile(file);

    // URL local para previsualizar en el modal
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imgPortada: previewUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (type === "album") {
        await updateAlbum(
          data.id,
          {
            titulo: formData.titulo,
            date: formData.date,
            precio: parseFloat(formData.precio),
            genre: selectedGenres,
            // si quieres, aquí puedes añadir canciones_ids / artista_emails
          },
          coverFile,
        );
      } else {
        await updateSong(
          data.id,
          {
            titulo: formData.titulo,
            date: formData.date,
            precio: parseFloat(formData.precio),
            genres: selectedGenres,
            idAlbum: data.idAlbum ?? null,
            // artista_emails si hace falta
          },
          coverFile,
        );
      }
      alert(
        `${type === "album" ? "Álbum" : "Canción"} actualizado correctamente`,
      );
      onSave();
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;
      alert(`Error al actualizar: ${msg}`);
      console.error(err);
    }
  };

  // calcular src de la portada (ruta de BD vs blob local)
  const coverSrc =
    formData.imgPortada &&
    (coverFile ? formData.imgPortada : fileURL(formData.imgPortada));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Editar {type === "album" ? "Álbum" : "Canción"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Título</label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de lanzamiento</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Precio (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={(e) =>
                setFormData({ ...formData, precio: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Géneros (seleccione / deseleccione)</label>
            <div className="genres-list">
              {allGenres.length === 0 && <em>Cargando géneros...</em>}
              {allGenres.map((g, idx) => {
                const name =
                  typeof g === "string" ? g : (g.nombre ?? String(g));
                return (
                  <label key={idx} className="genre-item">
                    <input
                      type="checkbox"
                      checked={selectedGenres.includes(String(name))}
                      onChange={() => toggleGenre(name)}
                    />
                    <span className="genre-name">{name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Portada</label>
            {coverSrc && (
              <div className="cover-preview">
                <img src={coverSrc} alt="Portada actual" />
                {!coverFile && (
                  <p className="cover-path">
                    Ruta guardada: {formData.imgPortada}
                  </p>
                )}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
            />
            {uploadError && <p className="upload-error">{uploadError}</p>}
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
