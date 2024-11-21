function updateNav() {
    const user = window.user;

    const nav = document.getElementById('navbarNav');

    if (user.tipoUsuario === 'admin') {
        nav.innerHTML = `
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/inicio">Inicio</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/sobre_nosotros">Sobre Nosotros</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/citas_programadas">Citas programadas</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/infracciones">Listado de infracciones</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/logout">Cerrar Sesión</a>
                </li>
            </ul>
        `;
    } else if (user.tipoUsuario === 'usuario') {
        nav.innerHTML = `
            <ul class="navbar-nav ms-auto">
                <li class="nav-item">
                    <a class="nav-link" href="/inicio">Inicio</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/sobre_nosotros">Sobre Nosotros</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/cita_programada">Citas programadas</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/logout">Cerrar Sesión</a>
                </li>
            </ul>
        `;
    }
}

document.addEventListener('DOMContentLoaded', updateNav);
