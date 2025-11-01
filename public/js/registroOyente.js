// Este archivo contiene la lógica del cliente. Puedes incluir interacciones y manipulaciones del DOM utilizando Bootstrap.

document.addEventListener('DOMContentLoaded', function() {

    const form = document.getElementById('signupForm');
    const pwd = document.getElementById('password');
    const pwd2 = document.getElementById('password2');
    const edad = document.getElementById('edad');
    const imgInput = document.getElementById('img_perfil');
    const preview = document.getElementById('previewImg');

    form.addEventListener('submit', (e) => {
        // validación nativa + comprobaciones extra
        let valid = form.checkValidity();

        if (pwd.value !== pwd2.value) {
            valid = false;
            pwd2.setCustomValidity('no-coincide');
            pwd2.classList.add('is-invalid');
        } else {
            pwd2.setCustomValidity('');
            pwd2.classList.remove('is-invalid');
        }

        const edadVal = parseInt(edad.value, 10);
        if (isNaN(edadVal) || edadVal < 0 || edadVal > 120) {
            valid = false;
            edad.classList.add('is-invalid');
        } else {
            edad.classList.remove('is-invalid');
        }

        if (!valid) {
            e.preventDefault();
            e.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        // aquí el formulario se enviará al backend (action="/api/registro")
        // si quieres evitar envío y usar fetch, reemplaza por fetch POST JSON.
    });

    pwd2.addEventListener('input', () => {
        if (pwd.value === pwd2.value) {
            pwd2.setCustomValidity('');
            pwd2.classList.remove('is-invalid');
        }
    });

    // Previsualizar imagen de perfil
    imgInput?.addEventListener('change', (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) {
            preview.style.display = 'none';
            preview.src = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
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

    // Otras interacciones y lógica del cliente pueden ser añadidas aquí
});