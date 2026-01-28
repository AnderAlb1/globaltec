// Configuración de Firebase - REEMPLAZA CON TUS DATOS
const firebaseConfig = {
  apiKey: "AIzaSyAiHV9CjjR2pYwgZfdQxk3cCkTxrtVUeQo",
  authDomain: "global-reportesmtto.firebaseapp.com",
  projectId: "global-reportesmtto",
  storageBucket: "global-reportesmtto.firebasestorage.app",
  messagingSenderId: "130610536156",
  appId: "1:130610536156:web:0a2c65a9d2481ce9af9e19"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const db = firebase.firestore();
const auth = firebase.auth();

// Configurar persistencia de auth para móviles
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Persistencia de auth configurada");
    })
    .catch((error) => {
        console.error("Error al configurar persistencia:", error);
    });

// Deshabilitar sincronización automática en background (opcional)
db.disableNetwork()
    .then(() => {
        return db.enableNetwork();
    })
    .then(() => {
        console.log("Red de Firestore reconfigurada");
    });

console.log("Firebase inicializado correctamente");

// ============================================
// MANEJO DE VISIBILIDAD DE PÁGINA (MÓVILES)
// ============================================

// Detectar cuando la página se vuelve visible (usuario regresa a la app)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('Página visible nuevamente');
        
        // Verificar si hay una sesión activa
        if (usuarioActual) {
            // No hacer nada, mantener el estado actual
            console.log('Usuario ya autenticado, manteniendo estado');
        } else {
            // Si no hay usuario, verificar autenticación
            console.log('Verificando autenticación...');
        }
    } else {
        console.log('Página en background');
    }
});

// Detectar cuando la página está a punto de descargarse
window.addEventListener('pagehide', function(event) {
    // Guardar timestamp para detectar recargas forzadas
    sessionStorage.setItem('lastPageHide', Date.now());
});

// Detectar cuando la página se carga
window.addEventListener('pageshow', function(event) {
    const lastHide = sessionStorage.getItem('lastPageHide');
    const now = Date.now();
    
    // Si fue un pageshow después de un pagehide reciente (menos de 2 segundos)
    // es probable que sea una navegación back/forward
    if (lastHide && (now - parseInt(lastHide)) < 2000) {
        console.log('Navegación back/forward detectada');
        
        // Si viene del back/forward cache (bfcache)
        if (event.persisted) {
            console.log('Página restaurada desde caché');
            // La página se restauró desde caché, no recargar
            return;
        }
    }
});

// Prevenir recarga automática cuando se restaura desde background
let paginaEnBackground = false;

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        paginaEnBackground = true;
        console.log('Página ocultada');
    } else {
        if (paginaEnBackground) {
            console.log('Página restaurada, NO recargando');
            paginaEnBackground = false;
            
            // Asegurar que el estado visual esté correcto
            if (usuarioActual) {
                // Refrescar datos sin recargar página
                actualizarVistaActual();
            }
        }
    }
});

// Función para actualizar la vista actual sin recargar la página
function actualizarVistaActual() {
    console.log('Actualizando vista actual...');
    
    // Determinar qué vista está activa
    const seccionActiva = document.querySelector('.seccion-contenido:not(.oculto)');
    
    if (!seccionActiva) return;
    
    const seccionId = seccionActiva.id;
    
    // Recargar datos según la sección activa
    if (seccionId === 'seccion-clientes') {
        cargarClientes();
    } else if (seccionId === 'seccion-equipos') {
        cargarEquipos();
    } else if (seccionId === 'seccion-clientes-refrigeracion') {
        cargarClientesRefrigeracion();
    } else if (seccionId === 'seccion-equipos-refrigeracion') {
        cargarEquiposRefrigeracion();
    } else if (seccionId.includes('reporte')) {
        cargarTecnicosEnSelects();
    }
    
    console.log('Vista actualizada:', seccionId);
}

console.log('Sistema de manejo de visibilidad cargado');
