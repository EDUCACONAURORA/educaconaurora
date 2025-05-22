
// Manejo de la sesión del usuario
document.addEventListener("DOMContentLoaded", function () {
  // Elementos del DOM
  const userInfoContainer = document.getElementById("userInfoContainer");
  const userAvatar = document.getElementById("userAvatar");
  const userName = document.getElementById("userName");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileLink = document.getElementById("profileLink");

  // Verificar si hay un usuario registrado
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (currentUser) {
      mostrarInfoUsuario(currentUser);
    } else {
      ocultarInfoUsuario();
    }
  } catch (error) {
    console.error("Error al leer datos de usuario:", error);
    ocultarInfoUsuario();
  }

  // Manejar el cierre de sesión con delegación de eventos
  document.addEventListener("click", function (e) {
    if (e.target === logoutBtn || e.target.closest("#logoutBtn")) {
      cerrarSesion();
    }
  });

  // Configuración del modal
  configurarModal();

  // Funciones auxiliares
  function mostrarInfoUsuario(usuario) {
    try {
      userInfoContainer.style.display = "flex";

      // Mostrar iniciales del usuario como avatar
      const initials = usuario.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase();
      userAvatar.textContent = initials;

      // Mostrar nombre del usuario
      userName.textContent = usuario.name.split(" ")[0];

      if (profileLink) {
        profileLink.textContent = "Mi perfil";
        profileLink.href = "perfil.html";
      }
    } catch (error) {
      console.error("Error al mostrar info de usuario:", error);
    }
  }

  function ocultarInfoUsuario() {
    if (userInfoContainer) {
      userInfoContainer.style.display = "none";
    }
  }

  function cerrarSesion() {
    try {
      localStorage.removeItem("currentUser");
      console.log("Sesión cerrada - Redirigiendo a acceso.html");

      // Múltiples métodos de redirección como fallback
      window.location.replace("acceso.html");

      // Fallback después de 500ms si no redirige
      setTimeout(() => {
        if (window.location.pathname.indexOf("acceso.html") === -1) {
          window.location.href = "acceso.html";
        }
      }, 500);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      window.location.href = "acceso.html";
    }
  }

  function configurarModal() {
    const modal = document.getElementById("infoModal");
    const btn = document.getElementById("discoverBtn");
    const span = document.getElementsByClassName("close")[0];

    if (btn && modal && span) {
      btn.onclick = function () {
        modal.style.display = "block";
      };

      span.onclick = function () {
        modal.style.display = "none";
      };

      window.onclick = function (event) {
        if (event.target === modal) {
          modal.style.display = "none";
        }
      };
    }
  }
});
