// Configuración inicial para CodePen
document.addEventListener('DOMContentLoaded', function() {
    // Cargar la fuente Montserrat
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Funcionalidad del botón "Descubre más"
    const discoverBtn = document.getElementById('discoverBtn');
    let alreadyScrolled = false;
    
    discoverBtn.addEventListener('click', function() {
        document.getElementById('infoModal').style.display = 'flex';
       });
    
    // Cerrar modal
    document.querySelector('.close').addEventListener('click', function() {
      document.getElementById('infoModal').style.display = 'none';
    });
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
      if(event.target == document.getElementById('infoModal')) {
        document.getElementById('infoModal').style.display = 'none';
      }
    });
    
    // Smooth scroll para los enlaces del menú
    document.querySelectorAll('nav a').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if(targetId !== '#contacto') {
          alreadyScrolled = true;
          discoverBtn.textContent = 'Ver detalles';
        }
        document.querySelector(targetId).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });

      // Sistema de gestión de usuarios
   
// Modal de información
const infoModal = document.getElementById('infoModal');
const closeBtn = document.querySelector('.close');

// Mostrar modal al hacer clic en "Acerca del sistema"
document.querySelector('nav a[href="#registro"]').addEventListener('click', function(e) {
    e.preventDefault();
    infoModal.style.display = 'flex';
});

// Cerrar modal
closeBtn.addEventListener('click', function() {
    infoModal.style.display = 'none';
});

// Cerrar al hacer clic fuera
window.addEventListener('click', function(e) {
    if (e.target === infoModal) {
        infoModal.style.display = 'none';
    }
});

  });