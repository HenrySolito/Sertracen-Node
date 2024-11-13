const dateInput = document.getElementById('citaTramite');
const now = new Date();
now.setMinutes(now.getMinutes() - now.getTimezoneOffset());

const minDateTime = now.toISOString().slice(0, 16);
dateInput.min = minDateTime;
