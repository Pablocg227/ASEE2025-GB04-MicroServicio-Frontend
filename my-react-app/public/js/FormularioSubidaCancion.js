// FormularioSubidaCancion.js
// -------------------------------------------------------------
// Configura aquí la URL del backend de CONTENIDOS
const API_BASE = "http://127.0.0.1:8080";

// Deja el token en localStorage con clave "access_token" tras /auth/login
// localStorage.setItem("access_token", "<JWT>");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadSongForm");

  // Campos
  const campoTitulo = document.getElementById("nomCancion");
  const campoAudio = document.getElementById("archivoMp3"); // backend: 'audio'
  const campoPortada = document.getElementById("imgPortada"); // backend: 'portada'
  // const campoEmails = document.getElementById("emailArtista"); // backend: 'artistas_emails' (varios)
  const genreGrid = document.getElementById("genreGrid");
  const genreInvalid = document.getElementById("genreInvalid");
  const campoFecha = document.getElementById("date");
  const campoPrecio = document.getElementById("precio");
  const previewImg = document.getElementById("previewImg");

  // Carga géneros al iniciar
  loadGenres();

  async function loadGenres() {
    try {
      const res = await fetch(`${API_BASE}/api/generos`);
      if (!res.ok) throw new Error("No se pudieron obtener los géneros");
      const genres = await res.json();

      genreGrid.innerHTML = "";
      (genres || []).forEach((g) => {
        const id = `genre-${g.toLowerCase().replace(/\s+/g, "-")}`;

        // input (checkbox) que se enviará como "genres"
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "btn-check";
        input.id = id;
        input.value = g;
        input.autocomplete = "off";

        // etiqueta visual tipo botón (Bootstrap)
        const label = document.createElement("label");
        label.className = "btn btn-outline-primary btn-sm m-1";
        label.htmlFor = id;
        label.textContent = g;

        genreGrid.appendChild(input);
        genreGrid.appendChild(label);
      });
    } catch (e) {
      console.error(e);
      genreGrid.innerHTML =
        '<span class="text-muted">(géneros no disponibles)</span>';
    }
  }

  // Previsualización de la portada
  if (campoPortada && previewImg) {
    campoPortada.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewImg.src = ev.target.result;
          previewImg.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        previewImg.src = "";
        previewImg.style.display = "none";
      }
    });
  }

  // Validación simple de extensión de audio
  function audioExtensionValida(file) {
    if (!file) return false;
    const nombre = file.name.toLowerCase();
    return (
      nombre.endsWith(".mp3") ||
      nombre.endsWith(".wav") ||
      nombre.endsWith(".flac") ||
      nombre.endsWith(".ogg")
    );
  }

  // Submit
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Validación HTML5 (Bootstrap)
    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      return;
    }

    // Debe haber token
    const TOKEN = localStorage.getItem("authToken"); 
    if (!TOKEN) {
      alert(
        "No hay token de sesión. Inicia sesión para poder subir canciones.",
      );
      return;
    }

    // Géneros seleccionados
    const selectedGenres = Array.from(
      genreGrid.querySelectorAll('input[type="checkbox"]:checked'),
    ).map((el) => el.value);

    if (selectedGenres.length === 0) {
      if (genreInvalid) genreInvalid.style.display = "block";
      return;
    } else {
      if (genreInvalid) genreInvalid.style.display = "none";
    }

    // Archivo de audio obligatorio
    const audioFile = campoAudio.files[0];
    if (!audioFile) {
      alert("Debes seleccionar un archivo de audio.");
      return;
    }
    if (!audioExtensionValida(audioFile)) {
      alert("Formato de audio no válido. Usa MP3, WAV, FLAC u OGG.");
      return;
    }

    // Construye el FormData según espera el backend
    const fd = new FormData();
    fd.append("nomCancion", (campoTitulo.value || "").trim());
    fd.append("precio", String(campoPrecio.value || 0));

    selectedGenres.forEach((g) => fd.append("genres", g));

    const dateVal = (campoFecha?.value || "").trim();
    if (dateVal) fd.append("date", dateVal);

    // // Emails de artistas (separados por coma/espacios)
    // const emails = (campoEmails?.value || "")
    //   .split(/[,\s]+/)
    //   .map((s) => s.trim())
    //   .filter(Boolean);
    // emails.forEach((e) => fd.append("artistas_emails", e));

    // Archivos
    fd.append("audio", audioFile);
    const portadaFile = campoPortada?.files?.[0];
    if (portadaFile) fd.append("portada", portadaFile);

    // Envío
    try {
      // No establezcas Content-Type manualmente con FormData
      const res = await fetch(`${API_BASE}/api/canciones`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
        body: fd,
      });

      // Éxito (201/200)
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(
          `✅ Canción subida correctamente.${data?.id ? "\nID: " + data.id : ""}`,
        );
        
        // Limpiar formulario (opcional ya que nos vamos a ir)
        form.reset();
        if (previewImg) {
          previewImg.src = "";
          previewImg.style.display = "none";
        }
        form.classList.remove("was-validated");

        // --- NUEVA LÍNEA: REDIRECCIÓN ---
        window.location.href = "/musica";
        return;
      }

      // Error: intenta leer detalle
      let msg = `Error ${res.status}`;
      try {
        const err = await res.json();
        if (err?.detail) {
          const detail =
            typeof err.detail === "string"
              ? err.detail
              : JSON.stringify(err.detail);
          msg += `: ${detail}`;
        }
      } catch {
        /* ignore */
      }
      alert("❌ " + msg);
    } catch (e) {
      console.error(e);
      alert("❌ No se pudo contactar con el servidor.");
    }
  });
});
