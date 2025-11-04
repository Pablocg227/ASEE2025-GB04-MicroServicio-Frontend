// Validación del formulario de registro de artista + previsualización de imagen
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('artistForm');
  const pwd = document.getElementById('password');
  const pwd2 = document.getElementById('password2');
  const imgInput = document.getElementById('img_perfil');
  const preview = document.getElementById('previewImg');

  // Validación de contraseñas y del formulario
  form.addEventListener('submit', (e) => {
    let valid = form.checkValidity();

    // Verificar que las contraseñas coincidan
    if (pwd.value !== pwd2.value) {
      valid = false;
      pwd2.setCustomValidity('no-coincide');
      pwd2.classList.add('is-invalid');
    } else {
      pwd2.setCustomValidity('');
      pwd2.classList.remove('is-invalid');
    }

    // Si no es válido, prevenir envío
    if (!valid) {
      e.preventDefault();
      e.stopPropagation();
      form.classList.add('was-validated');
      return;
    }

    // Aquí podrías enviar los datos al backend por fetch POST si no quieres usar action
    // e.preventDefault();
    // const formData = new FormData(form);
    // fetch('/api/registroArtista', { method: 'POST', body: formData });
  });

  // Actualizar validación de contraseñas en tiempo real
  pwd2.addEventListener('input', () => {
    if (pwd.value === pwd2.value) {
      pwd2.setCustomValidity('');
      pwd2.classList.remove('is-invalid');
    }
  });

  // Previsualizar imagen
  imgInput?.addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
      preview.style.display = 'none';
      preview.src = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
});
