import { useState } from "react";
import "../../styles/EditModal.css";

export default function PlaylistFormModal({
  title,
  initialData,
  onSubmit,
  onClose,
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    setError("");

    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit} className="playlist-form">
          <label className="form-field">
            <span>Nombre</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Descripción (opcional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {error && <p className="upload-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
