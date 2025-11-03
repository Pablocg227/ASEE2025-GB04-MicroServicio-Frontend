// js/FormularioAlbum.js
// -------------------------------------------------------------
// Gestiona el formulario de subida de álbumes.
//
// - Carga dinámicamente la lista de canciones existentes.
// - Carga los géneros desde el microservicio de contenidos.
// - Permite seleccionar canciones y géneros.
// - Muestra una previsualización de la portada del álbum.
// - Envía todo al endpoint /api/albumes usando el JWT guardado en localStorage.

const API_BASE = "http://127.0.0.1:8080"; // mismo que en FormularioSubidaCancion.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias al DOM ---
  const form = document.getElementById("uploadAlbumForm");
  const imgPortadaInput = document.getElementById("imgPortada");
  const previewImg = document.getElementById("previewAlbumImg");

  // Lista de canciones
  const cancionesContainer = document.getElementById(
    "canciones-list-container",
  );
  const songsInvalid = document.getElementById("songsInvalid");

  // Géneros (mismo estilo de “cuadraditos” que en subida de canción)
  const genreGrid = document.getElementById("genreGrid");
  const genreInvalid = document.getElementById("genreInvalid");

  if (!form) {
    console.error(
      'El formulario con ID "uploadAlbumForm" no se encontró. Verifica el HTML.',
    );
    return;
  }

  // -------------------------------------------------------------
  // 1) Cargar canciones existentes para poder seleccionarlas
  // -------------------------------------------------------------
  const urlCanciones = `${API_BASE}/api/canciones`;

  function cargarCanciones() {
    if (!cancionesContainer) return;

    cancionesContainer.innerHTML =
      '<div class="text-muted p-3">Cargando canciones...</div>';

    fetch(urlCanciones)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error al cargar canciones: ${response.status}`);
        }
        return response.json();
      })
      .then((canciones) => {
        cancionesContainer.innerHTML = "";

        if (!canciones || canciones.length === 0) {
          cancionesContainer.innerHTML =
            '<div class="text-muted p-3">No hay canciones disponibles.</div>';
          return;
        }

        canciones.forEach((cancion) => {
          const songItem = document.createElement("div");
          songItem.className = "song-item";
          songItem.dataset.id = cancion.id;

          const rawCoverPath =
            cancion.imgSencillo ||
            cancion.portada ||
            cancion.imgPortada ||
            cancion.coverPath ||
            "";

          // URL por defecto si no hay imagen
          let coverUrl = "https://via.placeholder.com/50";

          if (rawCoverPath) {
            if (
              rawCoverPath.startsWith("http://") ||
              rawCoverPath.startsWith("https://")
            ) {
              // La API ya devuelve una URL completa
              coverUrl = rawCoverPath;
            } else if (rawCoverPath.startsWith("/")) {
              // La API devuelve una ruta absoluta (ej: /files/uploads/img/...)
              coverUrl = `${API_BASE}${rawCoverPath}`;
            } else {
              // Ruta relativa (ej: files/uploads/img/...)
              coverUrl = `${API_BASE}/${rawCoverPath}`;
            }
          }

          const precio =
            typeof cancion.precio === "number"
              ? cancion.precio.toFixed(2)
              : cancion.precio || "0.00";

          songItem.innerHTML = `
            <img src="${coverUrl}" alt="Portada de ${cancion.nomCancion || ""}" class="song-item-cover">
            <div class="song-item-info">
              <strong>${cancion.nomCancion || "(sin título)"}</strong>
              <small class="text-muted">ID: ${cancion.id} - ${precio} €</small>
            </div>
          `;

          songItem.addEventListener("click", () => {
            songItem.classList.toggle("selected");
          });

          cancionesContainer.appendChild(songItem);
        });
      })
      .catch((error) => {
        console.error("Error al cargar canciones:", error);
        cancionesContainer.innerHTML =
          '<div class="alert alert-danger">Error al cargar las canciones.</div>';
      });
  }

  if (cancionesContainer) {
    cargarCanciones();
  }

  // -------------------------------------------------------------
  // 2) Cargar géneros y mostrarlos como “chips” (igual que en canción)
  // -------------------------------------------------------------
  const urlGeneros = `${API_BASE}/api/generos`;

  async function cargarGeneros() {
    if (!genreGrid) return;

    try {
      const res = await fetch(urlGeneros);
      if (!res.ok) throw new Error(`Error al cargar géneros: ${res.status}`);
      const generos = await res.json();

      genreGrid.innerHTML = "";

      if (!generos || generos.length === 0) {
        genreGrid.innerHTML =
          '<span class="text-muted">(géneros no disponibles)</span>';
        return;
      }

      generos.forEach((g) => {
        const id = `genre-${g.toLowerCase().replace(/\s+/g, "-")}`;

        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "btn-check";
        input.id = id;
        input.value = g;
        input.autocomplete = "off";

        const label = document.createElement("label");
        label.className = "btn btn-outline-primary btn-sm m-1";
        label.htmlFor = id;
        label.textContent = g;

        genreGrid.appendChild(input);
        genreGrid.appendChild(label);
      });
    } catch (error) {
      console.error("Error al cargar géneros:", error);
      genreGrid.innerHTML =
        '<span class="text-muted">(géneros no disponibles)</span>';
    }
  }

  if (genreGrid) {
    cargarGeneros();
  }

  // -------------------------------------------------------------
  // 3) Previsualización de la portada del álbum
  // -------------------------------------------------------------
  if (imgPortadaInput && previewImg) {
    imgPortadaInput.addEventListener("change", () => {
      const file = imgPortadaInput.files && imgPortadaInput.files[0];
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

  // -------------------------------------------------------------
  // 4) Envío y validación del formulario
  // -------------------------------------------------------------
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();

    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      return;
    }

    // --- Validación extra: al menos un género seleccionado ---
    const selectedGenres = genreGrid
      ? Array.from(
          genreGrid.querySelectorAll('input[type="checkbox"]:checked'),
        ).map((el) => el.value)
      : [];

    if (selectedGenres.length === 0) {
      if (genreInvalid) genreInvalid.style.display = "block";
      return;
    } else if (genreInvalid) {
      genreInvalid.style.display = "none";
    }

    // --- Validación extra: al menos una canción seleccionada ---
    const selectedSongs = document.querySelectorAll(".song-item.selected");
    if (selectedSongs.length === 0) {
      if (songsInvalid) songsInvalid.style.display = "block";
      return;
    } else if (songsInvalid) {
      songsInvalid.style.display = "none";
    }

    // --- Construcción de FormData ---
    const formData = new FormData();

    // 1. Campos simples
    const titulo = form.querySelector("#nomAlbum")?.value || "";
    const fecha = form.querySelector("#date")?.value || "";
    const precio = form.querySelector("#precio")?.value || "";

    formData.append("titulo", titulo);
    formData.append("date", fecha);
    formData.append("precio", precio);

    // 2. Imagen de portada (opcional)
    if (imgPortadaInput && imgPortadaInput.files.length > 0) {
      formData.append("portada", imgPortadaInput.files[0]);
    }

    // 3. Géneros
    selectedGenres.forEach((g) => formData.append("genres", g));

    // 4. IDs de canciones seleccionadas
    selectedSongs.forEach((songItem) => {
      formData.append("canciones_ids", songItem.dataset.id);
    });

    // --- Conexión con el microservicio ---
    const microserviceURL = `${API_BASE}/api/albumes`;
    const token = localStorage.getItem("authToken"); // igual que en login y subida de canción

    if (!token) {
      alert("No hay token de sesión. Inicia sesión para poder subir álbumes.");
      return;
    }

    fetch(microserviceURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then((res) => {
        if (!res.ok) {
          return res
            .json()
            .catch(() => ({ detail: `Error HTTP ${res.status}` }))
            .then((errBody) => {
              const msg = errBody?.detail || `Error HTTP ${res.status}`;
              throw new Error(msg);
            });
        }
        return res.json();
      })
      .then((data) => {
        console.log("Álbum subido con éxito:", data);
        alert("✅ ¡Álbum subido correctamente!");

        form.reset();
        form.classList.remove("was-validated");

        if (previewImg) {
          previewImg.src = "";
          previewImg.style.display = "none";
        }

        // deseleccionar canciones
        document
          .querySelectorAll(".song-item.selected")
          .forEach((songItem) => songItem.classList.remove("selected"));
      })
      .catch((error) => {
        console.error("Error al subir el álbum:", error);
        alert("❌ Error al subir el álbum: " + error.message);
      });
  });
});
