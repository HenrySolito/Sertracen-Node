
const fechaNacimientoInput = document.getElementById('fechaNacimiento');
const today = new Date();
const minAgeDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());

fechaNacimientoInput.max = minAgeDate.toISOString().split("T")[0];
