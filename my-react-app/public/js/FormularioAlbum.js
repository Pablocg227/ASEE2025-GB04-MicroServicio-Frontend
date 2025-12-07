// js/FormularioAlbum.js
// -------------------------------------------------------------
// Gestiona el formulario de subida de álbumes.
//
// - Carga dinámicamente la lista de canciones existentes.
// - Carga los géneros desde el microservicio de contenidos.
// - Permite seleccionar canciones y géneros.
// - Muestra una previsualización de la portada del álbum.
// - Envía todo al endpoint /api/albumes usando el JWT guardado en localStorage.
// - Inicializa estadísticas del álbum en el microservicio de estadísticas.
//

// Backend principal (álbumes, canciones, géneros)
const API_BASE = "http://127.0.0.1:8080";

// Backend de estadísticas
const API_STATS = "http://127.0.0.1:8081";

// -------------------------------------------------------------
// FUNCIONES AUXILIARES (extraídas para reducir anidamiento)
// -------------------------------------------------------------

/**
 * Obtiene el ID del artista desde el token JWT
 */
function getArtistaIdFromToken() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.id || payload.artistaId;
  } catch (e) {
    console.error("Error al decodificar el token:", e);
    return null;
  }
}

/**
 * Construye la URL de la portada de una canción
 */
function construirUrlPortada(cancion) {
  const raw = cancion.imgSencillo || cancion.portada || cancion.imgPortada || cancion.coverPath || "";
  let coverUrl = "https://via.placeholder.com/50";

  if (raw) {
    if (raw.startsWith("http")) coverUrl = raw;
    else if (raw.startsWith("/")) coverUrl = `${API_BASE}${raw}`;
    else coverUrl = `${API_BASE}/${raw}`;
  }

  return coverUrl;
}

/**
 * Crea un elemento DOM para una canción
 */
function crearElementoCancion(cancion) {
  const songItem = document.createElement("div");
  songItem.className = "song-item";
  songItem.dataset.id = cancion.id;

  const coverUrl = construirUrlPortada(cancion);
  const precio = typeof cancion.precio === "number" 
    ? cancion.precio.toFixed(2) 
    : cancion.precio || "0.00";

  songItem.innerHTML = `
    <img src="${coverUrl}" class="song-item-cover">
    <div class="song-item-info">
      <strong>${cancion.nomCancion || "(sin título)"}</strong>
      <small class="text-muted">ID: ${cancion.id} - ${precio} €</small>
    </div>
  `;

  songItem.addEventListener("click", () => {
    songItem.classList.toggle("selected");
  });

  return songItem;
}

/**
 * Renderiza la lista de canciones en el contenedor
 */
function renderizarCanciones(canciones, container) {
  container.innerHTML = "";

  if (!canciones.length) {
    container.innerHTML = '<div class="text-muted p-3">No hay canciones disponibles.</div>';
    return;
  }

  canciones.forEach((cancion) => {
    const songItem = crearElementoCancion(cancion);
    container.appendChild(songItem);
  });
}

/**
 * Carga las canciones del artista desde la API
 */
async function cargarCanciones(container) {
  const artistaId = getArtistaIdFromToken();
  
  if (!artistaId) {
    container.innerHTML = '<div class="alert alert-danger">No se pudo obtener el ID del artista. Inicia sesión.</div>';
    return;
  }

  const urlCanciones = `${API_BASE}/api/artistas/${artistaId}/canciones`;
  container.innerHTML = '<div class="text-muted p-3">Cargando canciones...</div>';

  try {
    const response = await fetch(urlCanciones);
    
    if (!response.ok) {
      throw new Error(`Error al cargar canciones: ${response.status}`);
    }

    const canciones = await response.json();
    renderizarCanciones(canciones, container);
  } catch (error) {
    console.error(error);
    container.innerHTML = '<div class="alert alert-danger">Error al cargar las canciones.</div>';
  }
}

/**
 * Crea un checkbox de género
 */
function crearCheckboxGenero(genero) {
  const id = `genre-${genero.toLowerCase().replace(/\s+/g, "-")}`;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "btn-check";
  input.id = id;
  input.value = genero;

  const label = document.createElement("label");
  label.className = "btn btn-outline-primary btn-sm m-1";
  label.htmlFor = id;
  label.textContent = genero;

  return { input, label };
}

/**
 * Carga los géneros desde la API
 */
async function cargarGeneros(genreGrid) {
  const urlGeneros = `${API_BASE}/api/generos`;

  try {
    const response = await fetch(urlGeneros);
    
    if (!response.ok) {
      throw new Error("Error al cargar géneros");
    }

    const generos = await response.json();
    genreGrid.innerHTML = "";

    generos.forEach((genero) => {
      const { input, label } = crearCheckboxGenero(genero);
      genreGrid.appendChild(input);
      genreGrid.appendChild(label);
    });
  } catch (error) {
    console.error(error);
    genreGrid.innerHTML = '<span class="text-muted">(géneros no disponibles)</span>';
  }
}

/**
 * Maneja la previsualización de la imagen
 */
function setupImagePreview(imgPortadaInput, previewImg) {
  if (!imgPortadaInput || !previewImg) return;

  imgPortadaInput.addEventListener("change", () => {
    const file = imgPortadaInput.files?.[0];
    
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

/**
 * Valida los géneros seleccionados
 */
function validarGeneros(genreGrid, genreInvalid) {
  const selectedGenres = Array.from(
    genreGrid.querySelectorAll('input[type="checkbox"]:checked')
  ).map((el) => el.value);

  if (!selectedGenres.length) {
    genreInvalid.style.display = "block";
    return null;
  }
  
  genreInvalid.style.display = "none";
  return selectedGenres;
}

/**
 * Valida las canciones seleccionadas
 */
function validarCanciones(songsInvalid) {
  const selectedSongs = document.querySelectorAll(".song-item.selected");
  
  if (!selectedSongs.length) {
    songsInvalid.style.display = "block";
    return null;
  }
  
  songsInvalid.style.display = "none";
  return selectedSongs;
}

/**
 * Construye el FormData para enviar el álbum
 */
function construirFormData(form, imgPortadaInput, selectedGenres, selectedSongs) {
  const formData = new FormData();
  formData.append("titulo", form.querySelector("#nomAlbum").value);
  formData.append("date", form.querySelector("#date").value);
  formData.append("precio", form.querySelector("#precio").value);

  if (imgPortadaInput.files.length > 0) {
    formData.append("portada", imgPortadaInput.files[0]);
  }

  selectedGenres.forEach((g) => formData.append("genres", g));
  selectedSongs.forEach((s) => formData.append("canciones_ids", s.dataset.id));

  return formData;
}

/**
 * Inicializa las estadísticas del álbum
 */
async function inicializarEstadisticasAlbum(albumId) {
  if (!albumId) return;

  try {
    const response = await fetch(`${API_STATS}/estadisticas/album`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idAlbum: albumId }),
    });

    if (response.ok) {
      console.log("Estadísticas creadas correctamente.");
    } else {
      console.warn("Error estadísticas:", response.status);
    }
  } catch (error) {
    console.error("Error conectando con estadísticas:", error);
  }
}

/**
 * Envía el álbum a la API
 */
async function enviarAlbum(formData) {
  const token = localStorage.getItem("authToken");

  const response = await fetch(`${API_BASE}/api/albumes`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `Error HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Resetea el formulario después de enviar
 */
function resetearFormulario(form, previewImg) {
  form.reset();
  form.classList.remove("was-validated");
  previewImg.style.display = "none";

  document.querySelectorAll(".song-item.selected")
    .forEach((x) => x.classList.remove("selected"));
}

/**
 * Maneja el envío del formulario
 */
async function manejarEnvioFormulario(event, form, imgPortadaInput, genreGrid, genreInvalid, songsInvalid, previewImg) {
  event.preventDefault();
  event.stopPropagation();

  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  // Validar géneros
  const selectedGenres = validarGeneros(genreGrid, genreInvalid);
  if (!selectedGenres) return;

  // Validar canciones
  const selectedSongs = validarCanciones(songsInvalid);
  if (!selectedSongs) return;

  // Construir y enviar datos
  const formData = construirFormData(form, imgPortadaInput, selectedGenres, selectedSongs);

  try {
    const data = await enviarAlbum(formData);
    console.log("Álbum subido:", data);

    // Inicializar estadísticas
    await inicializarEstadisticasAlbum(data?.id);

    alert("✅ ¡Álbum subido correctamente!");
    resetearFormulario(form, previewImg);
    window.location.href = "/musica";
  } catch (error) {
    console.error(error);
    alert("❌ Error al subir el álbum: " + error.message);
  }
}

// -------------------------------------------------------------
// INICIALIZACIÓN PRINCIPAL
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadAlbumForm");
  const imgPortadaInput = document.getElementById("imgPortada");
  const previewImg = document.getElementById("previewAlbumImg");
  const cancionesContainer = document.getElementById("canciones-list-container");
  const songsInvalid = document.getElementById("songsInvalid");
  const genreGrid = document.getElementById("genreGrid");
  const genreInvalid = document.getElementById("genreInvalid");

  if (!form) {
    console.error('El formulario con ID "uploadAlbumForm" no se encontró.');
    return;
  }

  // Cargar datos iniciales
  cargarCanciones(cancionesContainer);
  cargarGeneros(genreGrid);
  setupImagePreview(imgPortadaInput, previewImg);

  // Configurar evento de envío
  form.addEventListener("submit", (event) => {
    manejarEnvioFormulario(event, form, imgPortadaInput, genreGrid, genreInvalid, songsInvalid, previewImg);
  });
});
