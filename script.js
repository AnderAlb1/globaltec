// ============================================
// VARIABLES GLOBALES
// ============================================

let fotosSeleccionadas = [];
let usuarioActual = null;
let esAdmin = false;
let clientesCache = []; // Cache para búsqueda rápida
let equiposCache = []; // Cache para búsqueda rápida

// ============================================
// AUTENTICACIÓN
// ============================================

let ultimaSeccionAbierta = localStorage.getItem("ultimaSeccion");


// Verificar si hay sesión guardada al cargar
auth.onAuthStateChanged((user) => {
    if (user) {
        usuarioActual = user;
        verificarAdmin(user);
        
        // Primero mostrar la app (sin el blur)
        mostrarAppPrincipal();
        
        // Luego ocultar la pantalla de carga para ver el blur sobre la app
        setTimeout(() => {
            document.getElementById("pantalla-cargando").style.opacity = "0";
            setTimeout(() => {
                document.getElementById("pantalla-cargando").style.display = "none";
            }, 400);
        }, 100);

        setTimeout(() => {
            mostrarSeccion(ultimaSeccionAbierta);
            
            document.getElementById("menuLateral").classList.remove("activo");
            document.getElementById("menuOverlay").classList.remove("activo");
        }, 500);
    } else {
        // Ocultar pantalla de carga
        document.getElementById("pantalla-cargando").style.opacity = "0";
        setTimeout(() => {
            document.getElementById("pantalla-cargando").style.display = "none";
        }, 400);
        
        mostrarPantallaLogin();
    }
});


// Login
document.getElementById('formLogin').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const mantenerSesion = document.getElementById('mantenerSesion').checked;
    
    // Configurar persistencia
    const persistencia = mantenerSesion ? 
        firebase.auth.Auth.Persistence.LOCAL : 
        firebase.auth.Auth.Persistence.SESSION;
    
    auth.setPersistence(persistencia)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            usuarioActual = userCredential.user;
            verificarAdmin(userCredential.user);
            mostrarAppPrincipal();
        })
        .catch((error) => {
            mostrarError('Correo o contraseña incorrectos');
            console.error('Error de login:', error);
        });
});

// Cerrar sesión
window.cerrarSesion = function() {
    if (confirm('¿Desea cerrar sesión?')) {
        auth.signOut()
            .then(() => {
                mostrarPantallaLogin();
                usuarioActual = null;
                esAdmin = false;
            })
            .catch((error) => {
                alert('Error al cerrar sesión: ' + error.message);
            });
    }
}

// Verificar si el usuario es admin
function verificarAdmin(user) {
    // El primer usuario creado o con email específico es admin
    if (user.email === 'anderalb1@gmail.com') {
        esAdmin = true;
        document.getElementById('solo-admin-usuarios').style.display = 'block';
        document.getElementById('no-admin-usuarios').style.display = 'none';
    } else {
        esAdmin = false;
        document.getElementById('solo-admin-usuarios').style.display = 'none';
        document.getElementById('no-admin-usuarios').style.display = 'block';
    }
}

// Mostrar pantalla de login
// Mostrar pantalla de login
function mostrarPantallaLogin() {
    const pantallaLogin = document.getElementById('pantalla-login');
    pantallaLogin.classList.add('mostrar');
    pantallaLogin.style.display = 'flex';
    document.getElementById('app-principal').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('errorLogin').classList.remove('mostrar');
}

// Mostrar app principal
function mostrarAppPrincipal() {
    document.getElementById('pantalla-login').style.display = 'none';
    document.getElementById('app-principal').style.display = 'block';
    
    // Cargar datos
    cargarClientes();
    cargarEquipos();
    cargarClientesEnSelects();
    
    if (esAdmin) {
        cargarUsuarios();
    }
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const errorElement = document.getElementById('errorLogin');
    errorElement.textContent = mensaje;
    errorElement.classList.add('mostrar');
    
    setTimeout(() => {
        errorElement.classList.remove('mostrar');
    }, 5000);
}

// ============================================
// GESTIÓN DE USUARIOS (SOLO ADMIN)
// ============================================

// Crear nuevo usuario
document.getElementById('formUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!esAdmin) {
        alert('Solo el administrador puede crear usuarios');
        return;
    }
    
    const email = document.getElementById('usuarioEmail').value;
    const password = document.getElementById('usuarioPassword').value;
    
    // Guardar usuario actual para re-autenticarlo después
    const usuarioActualTemp = auth.currentUser;
    
    // Crear usuario
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Usuario creado exitosamente');
            
            // Cerrar sesión del nuevo usuario y re-autenticar al admin
            return auth.updateCurrentUser(usuarioActualTemp);
        })
        .then(() => {
            document.getElementById('formUsuario').reset();
            cargarUsuarios();
        })
        .catch((error) => {
            let mensaje = 'Error al crear usuario';
            if (error.code === 'auth/email-already-in-use') {
                mensaje = 'Este correo ya está registrado';
            } else if (error.code === 'auth/weak-password') {
                mensaje = 'La contraseña debe tener al menos 6 caracteres';
            } else if (error.code === 'auth/invalid-email') {
                mensaje = 'Correo electrónico inválido';
            }
            alert(mensaje);
            console.error('Error:', error);
        });
});

// Cargar lista de usuarios (solo muestra info básica)
function cargarUsuarios() {
    if (!esAdmin) return;
    
    const lista = document.getElementById('listaUsuarios');
    lista.innerHTML = '<p class="texto-info">Los usuarios se gestionan desde Firebase Console para mayor seguridad.</p>';
    lista.innerHTML += `<p class="texto-info">Para eliminar usuarios, ve a: <br><a href="https://console.firebase.google.com/" target="_blank" style="color: #4CAF50;">Firebase Console → Authentication → Users</a></p>`;
}

// ============================================
// FUNCIÓN PARA TOGGLE MENÚ LATERAL
// ============================================

window.toggleMenuLateral = function() {
    const menuLateral = document.getElementById('menuLateral');
    const menuOverlay = document.getElementById('menuOverlay');
    
    menuLateral.classList.toggle('activo');
    menuOverlay.classList.toggle('activo');
}

// Cerrar menú al hacer clic en overlay (solo móvil/tablet)
document.addEventListener('DOMContentLoaded', function() {
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenuLateral);
    }
});

// ============================================
// FUNCIÓN PARA MOSTRAR SECCIONES
// ============================================

window.mostrarSeccion = function(seccion) {
    // Ocultar todas las secciones
    document.getElementById('seccion-clientes').classList.add('oculto');
    document.getElementById('seccion-equipos').classList.add('oculto');
    document.getElementById('seccion-reporte').classList.add('oculto');
    document.getElementById('seccion-protocolo').classList.add('oculto');
    document.getElementById('seccion-ficha').classList.add('oculto');
    document.getElementById('seccion-usuarios').classList.add('oculto');
    
    // Quitar clase activa de todos los botones del menú
    document.querySelectorAll('.btn-menu-lateral:not(.btn-logout)').forEach(btn => {
        btn.classList.remove('activo');
    });
    
    // Mostrar sección seleccionada y activar botón
    const botones = document.querySelectorAll('.btn-menu-lateral:not(.btn-logout)');
    
    if (seccion === 'clientes') {
        document.getElementById('seccion-clientes').classList.remove('oculto');
        botones[0].classList.add('activo');
        // cargarClientes(); // Esta función ya existe en tu script.js
    } else if (seccion === 'equipos') {
        document.getElementById('seccion-equipos').classList.remove('oculto');
        botones[1].classList.add('activo');
        // cargarEquipos(); // Esta función ya existe en tu script.js
    } else if (seccion === 'reporte') {
        document.getElementById('seccion-reporte').classList.remove('oculto');
        botones[2].classList.add('activo');
        // cargarClientesEnSelects(); // Esta función ya existe en tu script.js
    } else if (seccion === 'protocolo') {
        document.getElementById('seccion-protocolo').classList.remove('oculto');
        botones[3].classList.add('activo');
        cargarClientesEnProtocolo();
    } else if (seccion === 'ficha') {
        document.getElementById('seccion-ficha').classList.remove('oculto');
        botones[4].classList.add('activo');
        cargarClientesEnFicha();
    } else if (seccion === 'usuarios') {
        document.getElementById('seccion-usuarios').classList.remove('oculto');
        botones[5].classList.add('activo');
        // if (esAdmin) cargarUsuarios(); // Esta función ya existe en tu script.js
    }

    // Guardar última sección abierta
    localStorage.setItem("ultimaSeccion", seccion);
    
    // En móvil/tablet, cerrar el menú después de seleccionar
    if (window.innerWidth < 1025) {
        toggleMenuLateral();
    }

    
}
// ============================================
// funciones para cargar los datos en generar protocolos y  generar fichas
// ============================================

function cargarClientesEnProtocolo() {
    const select = document.getElementById("protocoloCliente");
    select.innerHTML = `<option value="">-- Seleccione un cliente --</option>`;

    // Cargar directamente desde Firebase en lugar de usar cache
    db.collection('clientes')
        .orderBy('nombre')
        .get()
        .then((querySnapshot) => {
            const clientes = [];
            querySnapshot.forEach(doc => {
                clientes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            clientes.forEach(c => {
                const op = document.createElement("option");
                op.value = c.id;
                op.textContent = c.nombre;
                select.appendChild(op);
            });
        })
        .catch((error) => {
            console.error('Error cargando clientes en protocolo:', error);
        });
}

let logoProtocolo = "";

document.getElementById("protocoloCliente").addEventListener("change", function () {
    const id = this.value;
    if (!id) return;

    db.collection("clientes").doc(id).get().then(doc => {
        if (doc.exists) {
            logoProtocolo = doc.data().logo || "";
        }
    });
});

document.getElementById("formProtocolo").addEventListener("submit", function(e) {
    e.preventDefault();  // ❗ evita recargar la página
    generarPDF_Protocolo(); // ❗ llama la función que genera el PDF
});



window.generarPDF_Protocolo = function () {

    const clienteId = document.getElementById("protocoloCliente").value;
    const tipoEquipo = document.getElementById("protocoloTipoEquipo").value;
    const fecha = new Date().toLocaleDateString();

    if (!clienteId || !tipoEquipo) {
        alert("Debe seleccionar el cliente y el tipo de equipo");
        return;
    }

    // Obtener nombre y logo del cliente
    db.collection("clientes").doc(clienteId).get().then(doc => {
        const cliente = doc.data();

        const datos = {
            fecha,
            logo: cliente.logo || "",
            tipoEquipo,
            clienteNombre: cliente.nombre
        };

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("p", "pt", "letter");

        construirPDF_Protocolo(pdf, datos);
        pdf.save(`PROTOCOLO_${cliente.nombre}_${tipoEquipo}.pdf`);
    });
}

function construirPDF_Protocolo(pdf, d) {

    const margin = 20;
    let y = 20;

    // ==============================
    //     ENCABEZADO EN 3 COLUMNAS
    // ==============================

    // ---- Columna 1 (Izquierda) ----
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(`Código: PRD001`, margin, y + 20);
    pdf.text(`Versión: 01`, margin, y + 40);
    pdf.text(`Fecha de emisión: ${d.fecha}`, margin, y + 60);

    // ---- Columna 2 (Centro – Título) ----
    pdf.setFontSize(10);
    pdf.text("PROTOCOLO DE MANTENIMIENTO, LIMPIEZA Y", 300, y + 28, { align: "center" });
    pdf.text("DESINFECCIÓN DE EQUIPOS BIOMÉDICOS", 300, y + 48, { align: "center" });

    // ---- Columna 3 (Derecha – Logo) ----
    if (d.logo) {
        pdf.addImage(d.logo, "PNG", 480, y, 80, 60); 
    }

    // -----------------------------
    // LÍNEA HORIZONTAL BAJO EL HEADER
    // -----------------------------
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.9);
    pdf.line(margin, y + 65, 560, y + 65);

    // Ajustamos posición inicial después del encabezado
    y = y + 75;

    // ==============================
    // SECCIÓN: TÍTULO PRINCIPAL
    // ==============================
    barraTitulo(pdf, d.tipoEquipo, y);
    y += 40;

    // ==============================
    // ADVERTENCIAS Y PRECAUCIONES
    // ==============================
    y = seccionTexto(pdf, "ADVERTENCIAS Y PRECAUCIONES", obtenerAdvertencias(d.tipoEquipo), y);

    // ==============================
    // MANTENIMIENTO DURANTE OPERACIÓN
    // ==============================
    y = seccionTexto(pdf, "MANTENIMIENTO DURANTE LA OPERACIÓN", obtenerOperacion(d.tipoEquipo), y);

    // ==============================
    // MANTENIMIENTO DIARIO
    // ==============================
    y = seccionTexto(pdf, "MANTENIMIENTO GENERAL DIARIO", obtenerDiario(d.tipoEquipo), y);

    // ==============================
    // MANTENIMIENTO SEMESTRAL
    // ==============================
    y = seccionTexto(pdf, "MANTENIMIENTO GENERAL SEMESTRAL", obtenerSemestral(d.tipoEquipo), y);

    // ==============================
    // LIMPIEZA Y DESINFECCIÓN
    // ==============================
    y = seccionTexto(pdf, "INDICACIONES PARA LIMPIEZA Y DESINFECCIÓN", obtenerLimpieza(d.tipoEquipo), y);
}

function barraTitulo(pdf, texto, y) {
    pdf.setFillColor(220, 220, 220);
    pdf.rect(40, y, 520, 25, "F");
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("Helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(texto.toUpperCase(), 50, y + 17);
}


function seccionTexto(pdf, titulo, textos, y) {

    barraTitulo(pdf, titulo, y);
    y += 35;

    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(11);

    textos.forEach(t => {
        const lines = pdf.splitTextToSize("• " + t, 520);
        pdf.text(lines, 40, y);

        y += lines.length * 14;

        if (y > 730) {
            pdf.addPage();
            y = 40;
        }
    });

    y += 20;
    return y;
}

function obtenerAdvertencias(tipo) {
    tipo = tipo.toUpperCase();

    switch (tipo) {

        case "UNIDAD ODONTOLOGICA":
        case "UNIDAD ODONTOLÓGICA":
            return [
                "Después de utilizar el equipo, asegurarse de cerrar correctamente llaves y válvulas.",
                "Revisar conexiones antes de encender el equipo.",
                "Evitar operar el equipo con humedad o líquidos presentes.",
                "No exponer conexiones eléctricas a zonas húmedas.",
                "Realizar limpieza solo con el equipo apagado."
            ];

        case "COMPRESOR":
            return [
                "Verificar que el equipo esté en un área ventilada.",
                "Evitar sobrepasar la presión máxima indicada por el fabricante.",
                "No operar el compresor con fugas visibles en mangueras.",
                "Evitar la acumulación de humedad dentro del tanque.",
                "Realizar purga del tanque antes de usar el equipo."
            ];

        default:
            return [
                "Verificar que el equipo esté en condiciones seguras de operación.",
                "No exponer el equipo a humedad excesiva.",
                "Evitar operar el equipo con daños visibles.",
                "Realizar limpieza previa antes de su uso."
            ];
    }
}
function obtenerOperacion(tipo) {
    tipo = tipo.toUpperCase();

    switch (tipo) {

        case "UNIDAD ODONTOLOGICA":
        case "UNIDAD ODONTOLÓGICA":
            return [
                "Supervisar que no existan ruidos anormales durante la operación.",
                "Verificar permanencia de presión y flujo en salidas neumáticas.",
                "Mantener superficies limpias durante el uso.",
                "Revisar temperatura del equipo cuando aplique.",
                "Asegurarse de que accesorios estén correctamente acoplados."
            ];

        case "COMPRESOR":
            return [
                "Verificar que el motor no presente sobrecalentamiento.",
                "Evaluar estabilidad de presión durante el ciclo de carga.",
                "Escuchar vibraciones o ruidos anormales.",
                "Confirmar correcta expulsión de humedad por válvula de purga.",
                "Controlar el ciclo de encendido/apagado según presión configurada."
            ];

        default:
            return [
                "Supervisar comportamiento normal del equipo durante su funcionamiento.",
                "Verificar estabilidad de parámetros básicos.",
                "Revisar que no existan fugas o ruidos anormales."
            ];
    }
}

function obtenerDiario(tipo) {
    tipo = tipo.toUpperCase();

    switch (tipo) {

        case "UNIDAD ODONTOLOGICA":
        case "UNIDAD ODONTOLÓGICA":
            return [
                "Realizar limpieza externa de todas las superficies.",
                "Verificar estado de cables, mangueras y conexiones.",
                "Retirar residuos acumulados en bandejas o recipientes.",
                "Comprobar funcionamiento básico de cada accesorio.",
                "Inspeccionar funcionamiento de la lámpara auxiliar."
            ];

        case "COMPRESOR":
            return [
                "Verificar presión sin carga.",
                "Revisar estado del filtro de aire.",
                "Confirmar que no existan fugas audibles.",
                "Limpieza externa del equipo.",
                "Inspeccionar válvula de seguridad."
            ];

        default:
            return [
                "Realizar limpieza externa del equipo.",
                "Verificar funcionamiento general.",
                "Identificar fallas visibles o desgaste prematuro."
            ];
    }
}

function obtenerSemestral(tipo) {
    tipo = tipo.toUpperCase();

    switch (tipo) {

        case "UNIDAD ODONTOLOGICA":
        case "UNIDAD ODONTOLÓGICA":
            return [
                "Lubricar mecanismos internos según manual del fabricante.",
                "Verificar estado de la lámpara y sus conexiones.",
                "Revisión técnica del sistema hidráulico y neumático.",
                "Evaluación completa del sillón y estructura mecánica.",
                "Reemplazo preventivo de mangueras según desgaste."
            ];

        case "COMPRESOR":
            return [
                "Desarmado y limpieza profunda del cabezal.",
                "Revisión de pistón, cilindro y anillos.",
                "Cambio de lubricante si aplica.",
                "Sondeo del tanque en busca de corrosión interna.",
                "Verificación estructural del chasis y soportes."
            ];

        default:
            return [
                "Lubricación general del equipo.",
                "Revisión técnica completa.",
                "Ajuste de tornillería y piezas móviles.",
                "Limpieza profunda interna si aplica."
            ];
    }
}

function obtenerLimpieza(tipo) {
    tipo = tipo.toUpperCase();

    switch (tipo) {

        case "UNIDAD ODONTOLOGICA":
        case "UNIDAD ODONTOLÓGICA":
            return [
                "Utilizar paños suaves y evitar productos abrasivos.",
                "Limpiar superficies después de cada paciente.",
                "Desinfectar mango de lámpara, bandejas y superficies táctiles.",
                "Evitar exceso de agua en partes eléctricas.",
                "Secar completamente antes de operar nuevamente."
            ];

        case "COMPRESOR":
            return [
                "Mantener el compresor libre de polvo.",
                "No permitir acumulación de humedad en superficies.",
                "Limpiar filtros de aire periódicamente.",
                "Evitar el uso de solventes que deterioren pintura o empaques."
            ];

        default:
            return [
                "Realizar limpieza externa con desinfectante compatible.",
                "Evitar el contacto directo con líquidos en componentes eléctricos.",
                "Secar completamente antes de su operación."
            ];
    }
}








function cargarClientesEnFicha() {
    const select = document.getElementById("fichaCliente");
    select.innerHTML = `<option value="">-- Seleccione un cliente --</option>`;

    // Cargar directamente desde Firebase en lugar de usar cache
    db.collection('clientes')
        .orderBy('nombre')
        .get()
        .then((querySnapshot) => {
            const clientes = [];
            querySnapshot.forEach(doc => {
                clientes.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            clientes.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            clientes.forEach(c => {
                const op = document.createElement("option");
                op.value = c.id;
                op.textContent = c.nombre;
                select.appendChild(op);
            });
        })
        .catch((error) => {
            console.error('Error cargando clientes en protocolo:', error);
        });
}


// ============================================
// PREVIEW DE LOGO EN BASE64
// ============================================

// Preview para agregar cliente
const inputLogoCliente = document.getElementById('clienteLogo');
if (inputLogoCliente) {
    inputLogoCliente.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('logoPreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Logo preview">`;
                preview.classList.remove('empty');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.add('empty');
        }
    });
}

// Preview para editar cliente
const inputLogoEditar = document.getElementById('editClienteLogo');
if (inputLogoEditar) {
    inputLogoEditar.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('editLogoPreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Logo preview">`;
                preview.classList.remove('empty');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.add('empty');
        }
    });
}

// ============================================
// RESPONSIVE - CERRAR MENÚ AL CAMBIAR TAMAÑO
// ============================================

let ventanaAncho = window.innerWidth;

window.addEventListener('resize', function() {
    const nuevoAncho = window.innerWidth;
    
    // Si cambiamos de móvil a desktop
    if (ventanaAncho < 1025 && nuevoAncho >= 1025) {
        const menuLateral = document.getElementById('menuLateral');
        const menuOverlay = document.getElementById('menuOverlay');
        menuLateral.classList.remove('activo');
        menuOverlay.classList.remove('activo');
    }
    
    ventanaAncho = nuevoAncho;
});

console.log('Sistema de menú lateral cargado correctamente');
window.eliminarCliente = function(id) {
    if (!confirm('¿Está seguro de eliminar este cliente? También se eliminarán sus equipos.')) {
        return;
    }
    
    // Primero eliminar equipos del cliente
    db.collection('equipos').where('clienteId', '==', id).get()
        .then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            // Luego eliminar el cliente
            return db.collection('clientes').doc(id).delete();
        })
        .then(() => {
            alert('Cliente eliminado');
            cargarClientes();
            cargarEquipos();
            cargarClientesEnSelects();
        })
        .catch((error) => {
            alert('Error al eliminar: ' + error.message);
        });
}

window.eliminarEquipo = function(id) {
    if (!confirm('¿Está seguro de eliminar este equipo?')) {
        return;
    }
    
    db.collection('equipos').doc(id).delete()
        .then(() => {
            alert('Equipo eliminado');
            cargarEquipos();
        })
        .catch((error) => {
            alert('Error al eliminar: ' + error.message);
        });
}

window.toggleEstadoAccesorio = function(button) {
    const estadoActual = button.getAttribute('data-estado');
    let nuevoEstado;
    
    if (estadoActual === 'none') {
        nuevoEstado = 'check';
        button.textContent = '✓';
        button.className = 'estado-btn activo-check';
    } else if (estadoActual === 'check') {
        nuevoEstado = 'x';
        button.textContent = 'X';
        button.className = 'estado-btn activo-x';
    } else {
        nuevoEstado = 'none';
        button.textContent = '-';
        button.className = 'estado-btn';
    }
    
    button.setAttribute('data-estado', nuevoEstado);
}

// ============================================
// GESTIÓN DE CLIENTES CON BÚSQUEDA
// ============================================

// Agregar cliente
document.getElementById('formCliente').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Tomar logo en Base64
    let logoBase64 = "";
    const file = document.getElementById('clienteLogo').files[0];

    if (file) {
        logoBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    const cliente = {
        nombre: document.getElementById('clienteNombre').value,
        direccion: document.getElementById('clienteDireccion').value,
        telefono: document.getElementById('clienteTelefono').value,
        correo: document.getElementById('clienteCorreo').value,
        logo: logoBase64,                 // ← GUARDADO
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: usuarioActual.email
    };

    db.collection('clientes').add(cliente)
        .then(() => {
            alert("Cliente agregado exitosamente");
            document.getElementById('formCliente').reset();
            document.getElementById('logoPreview').innerHTML = "";
            cargarClientes();
            cargarClientesEnSelects();
        })
        .catch(error => alert("Error al agregar: " + error.message));
});


// Cargar y mostrar clientes con búsqueda
function cargarClientes() {
    db.collection('clientes').orderBy('nombre').get()
        .then((querySnapshot) => {
            clientesCache = [];
            
            querySnapshot.forEach((doc) => {
                clientesCache.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            mostrarClientes(clientesCache);
        })
        .catch((error) => {
            console.error('Error al cargar clientes:', error);
        });
}

function mostrarClientes(clientes) {
    const lista = document.getElementById('listaClientes');
    lista.innerHTML = '';
    
    if (clientes.length === 0) {
        lista.innerHTML = '<p class="texto-info">No hay clientes que coincidan con la búsqueda</p>';
        return;
    }
    
    clientes.forEach((cliente) => {
        const div = document.createElement('div');
        div.className = 'item-lista';
        div.innerHTML = `
            <div class="item-info">
                <h3>📋 ${cliente.nombre}</h3>
                <p><strong>Dirección:</strong> ${cliente.direccion}</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                <p><strong>Correo:</strong> ${cliente.correo}</p>
            </div>
            <div class="item-acciones">
                <button class="btn-editar" onclick="abrirModalEditarCliente('${cliente.id}')">✏️ Editar</button>
                <button class="btn-eliminar" onclick="eliminarCliente('${cliente.id}')">🗑️ Eliminar</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Función de búsqueda de clientes
window.buscarClientes = function(texto) {
    const terminoBusqueda = texto.toLowerCase().trim();
    
    if (!terminoBusqueda) {
        mostrarClientes(clientesCache);
        return;
    }
    
    const clientesFiltrados = clientesCache.filter(cliente => {
        return cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
               cliente.direccion.toLowerCase().includes(terminoBusqueda) ||
               cliente.telefono.includes(terminoBusqueda) ||
               cliente.correo.toLowerCase().includes(terminoBusqueda);
    });
    
    mostrarClientes(clientesFiltrados);
}

// ============================================
// GESTIÓN DE EQUIPOS CON BÚSQUEDA
// ============================================

// Agregar equipo
document.getElementById('formEquipo').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const accesoriosTexto = document.getElementById('equipoAccesorios').value;
    const accesoriosArray = accesoriosTexto ? accesoriosTexto.split(',').map(a => a.trim()) : [];
    
    const equipo = {
        clienteId: document.getElementById('equipoCliente').value,
        nombre: document.getElementById('equipoNombre').value,
        marca: document.getElementById('equipoMarca').value,
        modelo: document.getElementById('equipoModelo').value,
        serie: document.getElementById('equipoSerie').value,
        ubicacion: document.getElementById('equipoUbicacion').value,
        accesorios: accesoriosArray,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: usuarioActual.email
    };
    
    db.collection('equipos').add(equipo)
        .then(() => {
            alert('Equipo agregado exitosamente');
            document.getElementById('formEquipo').reset();
            cargarEquipos();
        })
        .catch((error) => {
            alert('Error al agregar equipo: ' + error.message);
        });
});

// Cargar y mostrar equipos con búsqueda
function cargarEquipos() {
    // Primero cargar todos los clientes
    db.collection('clientes').get()
        .then((clientesSnapshot) => {
            const clientesMap = {};
            clientesSnapshot.forEach((doc) => {
                clientesMap[doc.id] = doc.data().nombre;
            });
            
            // Luego cargar equipos
            return db.collection('equipos').orderBy('nombre').get()
                .then((querySnapshot) => {
                    equiposCache = [];
                    
                    querySnapshot.forEach((doc) => {
                        const equipo = doc.data();
                        equiposCache.push({
                            id: doc.id,
                            ...equipo,
                            clienteNombre: clientesMap[equipo.clienteId] || 'N/A'
                        });
                    });
                    
                    mostrarEquipos(equiposCache);
                });
        })
        .catch((error) => {
            console.error('Error al cargar equipos:', error);
        });
}

function mostrarEquipos(equipos) {
    const lista = document.getElementById('listaEquipos');
    lista.innerHTML = '';
    
    if (equipos.length === 0) {
        lista.innerHTML = '<p class="texto-info">No hay equipos que coincidan con la búsqueda</p>';
        return;
    }
    
    equipos.forEach((equipo) => {
        const div = document.createElement('div');
        div.className = 'item-lista';
        div.innerHTML = `
            <div class="item-info">
                <h3>🔧 ${equipo.nombre} - ${equipo.marca}</h3>
                <p><strong>Cliente:</strong> ${equipo.clienteNombre}</p>
                <p><strong>Modelo:</strong> ${equipo.modelo} | <strong>Serie:</strong> ${equipo.serie}</p>
                <p><strong>Ubicación:</strong> ${equipo.ubicacion}</p>
                ${equipo.accesorios && equipo.accesorios.length > 0 ? `<p><strong>Accesorios:</strong> ${equipo.accesorios.join(', ')}</p>` : ''}
            </div>
            <div class="item-acciones">
                <button class="btn-editar" onclick="abrirModalEditarEquipo('${equipo.id}')">✏️ Editar</button>
                <button class="btn-eliminar" onclick="eliminarEquipo('${equipo.id}')">🗑️ Eliminar</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Función de búsqueda de equipos
window.buscarEquipos = function(texto) {
    const terminoBusqueda = texto.toLowerCase().trim();
    
    if (!terminoBusqueda) {
        mostrarEquipos(equiposCache);
        return;
    }
    
    const equiposFiltrados = equiposCache.filter(equipo => {
        return equipo.nombre.toLowerCase().includes(terminoBusqueda) ||
               equipo.marca.toLowerCase().includes(terminoBusqueda) ||
               equipo.modelo.toLowerCase().includes(terminoBusqueda) ||
               equipo.serie.toLowerCase().includes(terminoBusqueda) ||
               equipo.ubicacion.toLowerCase().includes(terminoBusqueda) ||
               equipo.clienteNombre.toLowerCase().includes(terminoBusqueda);
    });
    
    mostrarEquipos(equiposFiltrados);
}

// ============================================
// CARGAR DATOS EN SELECTS
// ============================================

function cargarClientesEnSelects() {
    db.collection('clientes').orderBy('nombre').get()
        .then((querySnapshot) => {
            // Select de equipos
            const selectEquipoCliente = document.getElementById('equipoCliente');
            if (selectEquipoCliente) {
                selectEquipoCliente.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
            }
            
            // Select de reporte
            const selectReporteCliente = document.getElementById('reporteCliente');
            if (selectReporteCliente) {
                selectReporteCliente.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
            }
            
            // Almacenar opciones en array para ordenar
            const opciones = [];
            
            querySnapshot.forEach((doc) => {
                const cliente = doc.data();
                opciones.push({
                    id: doc.id,
                    nombre: cliente.nombre
                });
            });
            
            // Ordenar alfabéticamente
            opciones.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            
            // Agregar opciones ordenadas
            opciones.forEach(opcion => {
                if (selectEquipoCliente) {
                    const option1 = document.createElement('option');
                    option1.value = opcion.id;
                    option1.textContent = opcion.nombre;
                    selectEquipoCliente.appendChild(option1);
                }
                
                if (selectReporteCliente) {
                    const option2 = document.createElement('option');
                    option2.value = opcion.id;
                    option2.textContent = opcion.nombre;
                    selectReporteCliente.appendChild(option2);
                }
            });
        })
        .catch((error) => {
            console.error('Error al cargar clientes en selects:', error);
        });
}

// Cuando se selecciona cliente en reporte, cargar sus equipos
document.getElementById('reporteCliente').addEventListener('change', function() {
    const clienteId = this.value;
    const selectEquipo = document.getElementById('reporteEquipo');
    const accesoriosContainer = document.getElementById('accesoriosContainer');
    
    selectEquipo.innerHTML = '<option value="">-- Seleccione un equipo --</option>';
    selectEquipo.disabled = !clienteId;
    accesoriosContainer.innerHTML = '<p class="texto-info">Seleccione un equipo para ver sus accesorios</p>';
    
    if (!clienteId) return;
    
    db.collection('equipos').where('clienteId', '==', clienteId).get()
        .then((querySnapshot) => {
            // Almacenar equipos en array
            const equipos = [];
            
            querySnapshot.forEach((doc) => {
                const equipo = doc.data();
                equipos.push({
                    id: doc.id,
                    nombre: equipo.nombre,
                    marca: equipo.marca,
                    ubicacion: equipo.ubicacion
                });
            });
            
            // Ordenar alfabéticamente por nombre del equipo
            equipos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            
            // Agregar equipos ordenados
            equipos.forEach(equipo => {
                const option = document.createElement('option');
                option.value = equipo.id;
                option.textContent = `${equipo.nombre} - ${equipo.marca} (${equipo.ubicacion})`;
                selectEquipo.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error al cargar equipos:', error);
        });
});

// Cuando se selecciona equipo, mostrar accesorios
document.getElementById('reporteEquipo').addEventListener('change', function() {
    const equipoId = this.value;
    const accesoriosContainer = document.getElementById('accesoriosContainer');
    
    if (!equipoId) {
        accesoriosContainer.innerHTML = '<p class="texto-info">Seleccione un equipo para ver sus accesorios</p>';
        return;
    }
    
    db.collection('equipos').doc(equipoId).get()
        .then((doc) => {
            if (!doc.exists) return;
            
            const equipo = doc.data();
            accesoriosContainer.innerHTML = '';
            
            if (!equipo.accesorios || equipo.accesorios.length === 0) {
                accesoriosContainer.innerHTML = '<p class="texto-info">Este equipo no tiene accesorios registrados</p>';
                return;
            }
            
            equipo.accesorios.forEach((accesorio, index) => {
                const div = document.createElement('div');
                div.className = 'accesorio-item';
                div.innerHTML = `
                    <label>${accesorio}</label>
                    <select class="estado-select" data-accesorio="${index}">
                        <option value="">-- Seleccionar --</option>
                        <option value="BUENO">✓ Bueno</option>
                        <option value="REGULAR">⚠ Regular</option>
                        <option value="MALO">✗ Malo</option>
                    </select>
                `;
                accesoriosContainer.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error al cargar accesorios:', error);
        });
});

// ============================================
// VERIFICACIÓN DE PARÁMETROS - TABLAS DINÁMICAS
// ============================================

// Detectar cambio en el equipo para mostrar tabla de verificación
document.getElementById('reporteEquipo').addEventListener('change', async function() {
    const equipoId = this.value;
    const verificacionContainer = document.getElementById('verificacionContainer');
    const verificacionTextarea = document.getElementById('verificacionParametros');
    
    // Limpiar contenedor
    verificacionContainer.innerHTML = '';
    verificacionTextarea.value = '';
    
    if (!equipoId) {
        verificacionTextarea.style.display = 'block';
        return;
    }
    
    try {
        const doc = await db.collection('equipos').doc(equipoId).get();
        if (!doc.exists) return;
        
        const equipo = doc.data();
        const nombreEquipo = equipo.nombre.toUpperCase();
        
        // Verificar si es LÁMPARA DE FOTOCURADO
        if (nombreEquipo.includes('LÁMPARA') && nombreEquipo.includes('FOTOCURADO')) {
            verificacionTextarea.style.display = 'none';
            generarTablaLamparaFotocurado(verificacionContainer);
            return;
        }
        
        // Verificar si es INCUBADORA
        if (nombreEquipo.includes('INCUBADORA')) {
            verificacionTextarea.style.display = 'none';
            generarTablaIncubadora(verificacionContainer);
            return;
        }
        
        // Para otros equipos, mostrar el textarea normal
        verificacionTextarea.style.display = 'block';
        
    } catch (error) {
        console.error('Error al verificar equipo:', error);
        verificacionTextarea.style.display = 'block';
    }
});

// ============================================
// GENERAR FORMULARIO PARA LÁMPARA DE FOTOCURADO
// ============================================
function generarTablaLamparaFotocurado(container) {
    const formularioHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; margin: 15px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; text-align: center;">
                💡 VERIFICACIÓN DE INTENSIDAD LUMÍNICA
            </h3>
            
            <div style="background: white; padding: 15px; border-radius: 8px; color: #333;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #667eea;">
                            📊 MEDIDA 1 EN mW/cm²
                        </label>
                        <input type="number" step="0.01" id="lampara_medida1_1" 
                               placeholder="Primera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #764ba2;">
                            📊 MEDIDA 2 EN mW/cm²
                        </label>
                        <input type="number" step="0.01" id="lampara_medida2_1" 
                               placeholder="Primera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #764ba2; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <input type="number" step="0.01" id="lampara_medida1_2" 
                               placeholder="Segunda medición"
                               style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <input type="number" step="0.01" id="lampara_medida2_2" 
                               placeholder="Segunda medición"
                               style="width: 100%; padding: 10px; border: 2px solid #764ba2; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <input type="number" step="0.01" id="lampara_medida1_3" 
                               placeholder="Tercera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #667eea; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <input type="number" step="0.01" id="lampara_medida2_3" 
                               placeholder="Tercera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #764ba2; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
            </div>
            
        </div>
    `;
    container.innerHTML = formularioHTML;
}

// ============================================
// GENERAR FORMULARIO PARA INCUBADORA
// ============================================
function generarTablaIncubadora(container) {
    const formularioHTML = `
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; color: white; margin: 15px 0;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; text-align: center;">
                🌡️ VERIFICACIÓN DE TEMPERATURA
            </h3>
                       
            <!-- MEDICIONES -->
            <div style="background: white; padding: 15px; border-radius: 8px; color: #333;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #f093fb;">
                            📊 MEDIDA 1 EN °C
                        </label>
                        <input type="number" step="0.01" id="incubadora_medida1_1" 
                               placeholder="Primera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f093fb; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <label style="display: block; font-weight: bold; margin-bottom: 8px; color: #f5576c;">
                            📊 MEDIDA 2 EN °C
                        </label>
                        <input type="number" step="0.01" id="incubadora_medida2_1" 
                               placeholder="Primera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f5576c; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                    <div>
                        <input type="number" step="0.01" id="incubadora_medida1_2" 
                               placeholder="Segunda medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f093fb; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <input type="number" step="0.01" id="incubadora_medida2_2" 
                               placeholder="Segunda medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f5576c; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <input type="number" step="0.01" id="incubadora_medida1_3" 
                               placeholder="Tercera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f093fb; border-radius: 5px; font-size: 14px;">
                    </div>
                    <div>
                        <input type="number" step="0.01" id="incubadora_medida2_3" 
                               placeholder="Tercera medición"
                               style="width: 100%; padding: 10px; border: 2px solid #f5576c; border-radius: 5px; font-size: 14px;">
                    </div>
                </div>
            </div>
            
        </div>
    `;
    container.innerHTML = formularioHTML;
}

// ============================================
// CAPTURAR DATOS DE LAS TABLAS
// ============================================
function obtenerDatosVerificacion() {
    const verificacionContainer = document.getElementById('verificacionContainer');
    
    // Si hay tabla de LÁMPARA
    if (document.getElementById('lampara_medida1_1')) {
        return {
            tipo: 'LAMPARA',
            medidas: [
                {
                    medida1: document.getElementById('lampara_medida1_1').value || '',
                    medida2: document.getElementById('lampara_medida2_1').value || ''
                },
                {
                    medida1: document.getElementById('lampara_medida1_2').value || '',
                    medida2: document.getElementById('lampara_medida2_2').value || ''
                },
                {
                    medida1: document.getElementById('lampara_medida1_3').value || '',
                    medida2: document.getElementById('lampara_medida2_3').value || ''
                }
            ]
        };
    }
    
    // Si hay tabla de INCUBADORA
    if (document.getElementById('incubadora_medida1_1')) {
        return {
            tipo: 'INCUBADORA',
            medidas: [
                {
                    medida1: document.getElementById('incubadora_medida1_1').value || '',
                    medida2: document.getElementById('incubadora_medida2_1').value || ''
                },
                {
                    medida1: document.getElementById('incubadora_medida1_2').value || '',
                    medida2: document.getElementById('incubadora_medida2_2').value || ''
                },
                {
                    medida1: document.getElementById('incubadora_medida1_3').value || '',
                    medida2: document.getElementById('incubadora_medida2_3').value || ''
                }
            ]
        };
    }
    
    // Si no hay tabla, devolver el textarea
    return {
        tipo: 'TEXTO',
        texto: document.getElementById('verificacionParametros').value || ''
    };
}

// ============================================
// GESTIÓN DE FOTOS
// ============================================

document.getElementById('fotos').addEventListener('change', function(e) {
    const archivos = e.target.files;
    fotosSeleccionadas = [];
    const previsualizacion = document.getElementById('previsualizacion');
    previsualizacion.innerHTML = '';
    
    for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        const lector = new FileReader();
        
        lector.onload = function(evento) {
            fotosSeleccionadas.push(evento.target.result);
            
            const img = document.createElement('img');
            img.src = evento.target.result;
            previsualizacion.appendChild(img);
        };
        
        lector.readAsDataURL(archivo);
    }
});

// ============================================
// EDITAR CLIENTES
// ============================================

window.abrirModalEditarCliente = function(id) {
    db.collection('clientes').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const cliente = doc.data();
                document.getElementById('editClienteId').value = id;
                document.getElementById('editClienteNombre').value = cliente.nombre;
                document.getElementById('editClienteDireccion').value = cliente.direccion;
                document.getElementById('editClienteTelefono').value = cliente.telefono;
                document.getElementById('editClienteCorreo').value = cliente.correo;
                
                document.getElementById('modalEditarCliente').style.display = 'block';
            }
        });
}

window.cerrarModalCliente = function() {
    document.getElementById('modalEditarCliente').style.display = 'none';
}

document.getElementById('formEditarCliente').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById("editClienteId").value;
    
    // Leer datos editados
    let nombre = document.getElementById("editClienteNombre").value;
    let direccion = document.getElementById("editClienteDireccion").value;
    let telefono = document.getElementById("editClienteTelefono").value;
    let correo = document.getElementById("editClienteCorreo").value;

    // Procesar logo (solo si el usuario seleccionó uno nuevo)
    let nuevoLogoBase64 = null;
    const archivoNuevo = document.getElementById("editClienteLogo").files[0];

    if (archivoNuevo) {
        nuevoLogoBase64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(archivoNuevo);
        });
    }

    // Construir objeto con datos actualizados
    const datosActualizados = {
        nombre,
        direccion,
        telefono,
        correo
    };

    // Solo agregamos logo si el usuario subió uno
    if (nuevoLogoBase64 !== null) {
        datosActualizados.logo = nuevoLogoBase64;
    }

    // Guardar en Firestore
    db.collection("clientes").doc(id).update(datosActualizados)
        .then(() => {
            alert("Cliente actualizado correctamente");
            cerrarModalCliente();
            cargarClientes();
        })
        .catch(error => {
            alert("Error al actualizar: " + error.message);
        });
});

// ============================================
// GENERAR PDF
// ============================================

document.getElementById('formReporte').addEventListener('submit', async function(e) {
    e.preventDefault();
    await generarPDF();
});

async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Obtener IDs
    const clienteId = document.getElementById('reporteCliente').value;
    const equipoId = document.getElementById('reporteEquipo').value;
    
    try {
        // Obtener datos del cliente
        const clienteDoc = await db.collection('clientes').doc(clienteId).get();
        const cliente = clienteDoc.data();
        
        // Obtener datos del equipo
        const equipoDoc = await db.collection('equipos').doc(equipoId).get();
        const equipo = equipoDoc.data();
        
        // Obtener otros datos del formulario
        const fecha = document.getElementById('reporteFecha').value;
        const servicioPor = document.querySelector('input[name="servicioPor"]:checked').value;
        const tipoMto = document.querySelector('input[name="tipoMto"]:checked').value;
        const estadoEquipo = document.querySelector('input[name="estadoEquipo"]:checked').value;
        
        // Tareas ejecutadas (checkboxes marcados)
        const tareasCheckboxes = document.querySelectorAll('#formReporte .checkbox-group input[type="checkbox"]:checked');
        const tareas = Array.from(tareasCheckboxes).map(cb => cb.value);
        
        const verificacionParametros = obtenerDatosVerificacion();
        const fallaReportada = document.getElementById('fallaReportada').value;
        const actividadMantenimiento = document.getElementById('actividadMantenimiento').value;
        const observaciones = document.getElementById('observaciones').value;
        
        // Estado de accesorios
        // Estado de accesorios
        const accesoriosSelects = document.querySelectorAll('.accesorio-item .estado-select');
        const accesoriosEstado = [];
        accesoriosSelects.forEach((select, idx) => {
            const estado = select.value;
            let simbolo = '-';
            if (estado === 'BUENO') simbolo = ' BUENO';
            else if (estado === 'REGULAR') simbolo = ' REGULAR';
            else if (estado === 'MALO') simbolo = ' MALO';
            
            accesoriosEstado.push({
                nombre: equipo.accesorios[idx],
                estado: simbolo
            });
        });
        

        // Construir PDF
        construirPDF(doc, {
            cliente,
            equipo,
            fecha,
            servicioPor,
            tipoMto,
            estadoEquipo,
            tareas,
            verificacionParametros,
            fallaReportada,
            actividadMantenimiento,
            observaciones,
            accesoriosEstado
        });
        
    } catch (error) {
        alert('Error al generar PDF: ' + error.message);
        console.error('Error:', error);
    }
}

function construirPDF(doc, datos) {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Colores
    const colorAzulClaro = [216, 232, 247];
    const colorNegro = [0, 0, 0];
    const colorGrisOscuro = [50, 50, 50];
    
    // =======================================
    // Logo y Firma en Base64 - EDITA ESTOS
    // =======================================
    const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAAA8CAYAAABo3+Q5AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAACVaSURBVHhe7ZwHmFXVuffHkvvd+92bL1Ga7SZRkaIxoiYmJiSW2EFEBaQjIIiKSFUjoIAoojCV3plh6L33OjOnTO+F6b3Xc+b0+X3PWmvv6cxArjeJz+N7WA/n7LPP2mu9//XW9a7x4kf6wZJX6ws/0g+HfgTvB0w/gvcDphsGr6FVa4/Udx3doVFDg7yloaFBts5u/5Fa0o2D1+DB0+CRzPZcg+k6cNm1NrzDUpl5LI7pR2OZdiyGD45G42tIJ7OmHk+DW+vHTYPHBZ62ff1DSS4kNf4GPLKJC61f/yp0w+DJyUjw1MQkkG0m1EB6jZ3XgyN4IcjM1JNJzDqTxsyzyUw7nUr/jWGM2BtNfFmdxq2m/v5ZpOBSgDUBp42pdfsXoRsHT8zH7aHB424CUkxWl0KNvrp4ldeCIzAW1VJnd8pWa3NS53RiKq7hlUATq8OzqbU75P2KYf88xqjnu6BBaICm+ciXmJfQClIzaNf/BUC8YfDkmAVweHACNsR7/Ts1IXH9ze2RfHE+lYp6AY64rtSieNk9Ht47Gs+ME0nk1tSr33ZuIf+h5Gl94V+QOgZP0xJuKVnK1gmyNXgIjM/jjZ3hPL3ByCcnk0gstzRKTnadgyfXh7AjqRi7S/xG9CDsm6YeAV9DJiN2RRBfXtfikf9TSq2wcCW3kiKLvZk8N6m7rIISzoTGcd6YwuXINEJir2JKTCcmNZOkjBwy8ksor7VgLqhgwYUEFl66yleXs1galo13WDYrDFmsNmWxLiKXzdGFBMYVsyOxiHPZVXJRqjm2XIaNC1NTu2JUDo9bjrG43kmZzUmVw43F3UC9p0EufsElMfaOqGPwpMoQoCnnRMiUrcHN0pBM/rjOxMfnUlhmzObVbWaeXh/Gysg8TudU8P7xZB5dfQlTYTUu3ZvUbYk2sbPZFTy1ycSg7fFMOpTI5IPxvHMokYmHE5l4RPu/sybvi2fioXjeOZzA2APx/GVLFA+vNOIblonVoaReOVXquXGpmbz14VK6PDqeu598j7v+9C539Z/Cf/d/j1/0f497n36P9z9fy6W0QiYfT+QO3zB+tdLMfSuN3LsynJ4rzPRaYab3SjO9V4XTe5X4HMLrOyLJkwumSQM1koae8sfcVDudfB2Wye83GHhyo5n+mwz8eXM4T22J5OmtUTyzJZJRuyIptimTci3qEDyl7z00SPPmkcB9E5rFE2sNBETkU1hno87uIK3KytLQTP6yPpR+Ky4xMDiarXGF1NgcUlrd8qUA1J2AGpeH7QkFfHImjY9OJjP9VAIzTiUz41TKjbXTKUw/nczM08lMOZHAb9cbuOfbiyy9koHVJdaw8mAVQz24PC6Cjlzml0+/j9e9Q7mp93C8ROs1Eq9eI/B64C16PDmJL1ft4VhmOX/YZOb/eRvo5muim6+Z7r5Guvsa6O5joJuPga4+Rm7zNvDExgiu5JUrvrULnnLM7G4n+5KL+fWKULr4hNHdJ4xu4n9vMz18DPTwuUJ33zCG7YigztWx7HUInq43pTtPA5ui8+m/3sSayDwqJDCaRDU0UGV3YC6u5nxupQTT4nTg8Qipdcn/VR/if+EUqM8Wp4vyehslVjulFtFslFpvtNVTarXK90INRRRWcz6rgpwaq1wyUm1q49RZUVdv46vV+/mPh8fg1Xs0t/YZxS2i9RXvR3JT7xE8MmAmgUdD2Bxfwn3+Ydzua6aHr4kevkZ6+DU1AWYXXwMPrYtgW3yexrbWFlM81427wU1kcR1PbzbT1dtID18Dd/qGyT7v8DFzh0843f1M3BVgYNGF1A6BE9QJeGrBiGkLxgwIimRxSCblNpeyY0KqZHPJWE2A5Ba6QZImZdKhaT6ZpmtSEpsswg2SkiSlH3RSY3F7RNyoe4ya2m+lPrMLypjw2Sq8eg3jpj4jufnBkdzSdxQ/EWCK9uBohkxdRlhaAZ9evEpX78sSqDt8TdzhZ2xsAoAuQrWuCmfxpatqZG1snnrlW2xMOhxHt+VhSsoE+H4mugnAfBSI3X3Duc//CvvTilr00R51DJ6SdMmijCorT64zsS+lFKdHrCKXZJDH06BAE0xyN9AgwVNMFRBn1NRzIbuCvUnF7E0q4Vx2Bek1VhyNLFcQKi9cB/LaTQGi4ksh1WIMTejp910fBR66zM8fHy/VpQDu5r4juFW0PqPx6j2CQVO+Jb2onJXRefRYfpEePkbubA2en5Gufkbu8jcw+XCCkm6ZfNBsvTanGqcLX2MWv/S7QlffUPk7/feqGejmZ+ROHyOPrTGSWm3t1OftEDwJg7Zaq+0uhu6IZNqxZE1l6pkWJYECNMlIoNDmZEtMIWP2RfPHDSE8tT6MF7eYeG5rBP3XG+m/LpSRe6PZFl9IhV3ZpeYS0lFT0qNLnNAJypr+PeQfdJyf9BnOTb1HcWvf0RLAW/uO5Jbeo/j3h8cwbdFGadfnnE3ltmVXlNQJ6WsFXncfE919Qnl1ZySVDjEfMSY5Wvlyeho4mVHBb9YIOxnGHb4GqYJb9iNUsoG7/AwM3hlDtVM4Gq1H3JI6BE8uIj2L0tDA/tRSnlwXxo7kIuxuBWCjLdH0/LGrJby5M5JnthiZfjyBwLh8zmaXYyyqwVRUw7mcCjbFFTD9ZBLPbApj5J4ozmVXSim9XhLudLnTLd1tpYI7mWU7VFpZy9SFG/H61Zvc0me0BE82IXUPjJRe6OptJ0irsTFwZzQ/W27gDh8FVmu1Ka539Q7hya3hJFRYNJMgFrXiXWJlHQOCw+niY+BOH5Oyb60Wgfh8p4+BewLCmHs+FbdcpK1H3ZKuCzzRkfi/1ulkzpkUhuwKJ72yTqpKXb+LtbY+Ko+nNhqYeiyR05nl5NXWY3M5NcXYRPUeDwW1NnnPpKMJvBBkZNHFFIKiswiOyWLbNZr4bmt0Dh8eT2DwdjN7Eguwi5xoZ7Nsh2KSs3h+3GK87h3OLcLGSakbpcDrOZxHBs3hbGgsF/JreHitgS4SOENLhjeCZ6Cbdyj91pk5elXZKqERBIRFVjsfnUrmDu8r8l4hcd2l1LXuS3iwJu4PCGNPSuF1WYA24Ak5kl6ktHVKrqSK1MJGITX914URXVyrOSsKmMDYAv603sCiSxlcrbI2qTI9fdbOaMT19Op6Fl9O5bXtZl7eZmZgcHiH7ZVtEdzrZ+DfvzzL5xfSqJZqtzPSNEOjyoUjF6K49+mP8Oo5UgL2E03qbu47Cq9ebzFw4hJScorZHFfMnT4hdJWMb8dhkQAaZcjQa1U4/uYM2b/gl8XpZG1kPvf5h8rQQqjL7tJJEcC1BU9I3yOrw0gor5V2szNqC55uZDVPTWe4Aw8p1fWMOxTPuAOx0nOSok0D5qIa/rrZxOcX0smvtbUBqT1q7ieWWexEFlVhyK/EmF+NqaDmGq2asIJq1obnM/9sKhdzynE1G+O1SY8vxb1KzQYEneLf+o7h5l5K2nTwvPqM5N8eGsPUzzdQUGNj7vl0fv7dFbr56eC1kjxN5XX1NfELfzMzTyXKJ7o8bi7kVvK79WF09Q5rI7GtWw/fMO70D2Pg9kgq7Q6ZO27ttbamNuDJecofKXUUVVLH15fTGbUvlue2hvPnDSHsTy7C5hShgRu7283UY8mM2BdHcoVIkamEdaf8lNItFkjrLzojsaIdlFtt2Jy6yuysk2YJArFYqmqZ9tUWvO4bwi19RnLrg0plilhP2Lvuf3gPvy3HSaux8+ZuYe9CNalpLS064w1KFfqGMXx3pPKyq+p5c080t3uHXPN3rcG729/A304l4dK8dz2VeC1qBzw9qHXL9NaQHeGM2RvDp2dTWRuRx7nMMqrrnTIsEKvYXFjNU+sN7BKAujXgpPveMUPFtzI80LL1UktoievmLx2cxleLCWmgdAqe1ot2W0xKDi+98w1e9w1rdFSUpzkKr54jeHjAHE5cieFSYS391hm5Tao8IWXtSZCQSBG3mejqHcqzQRHEV9Yz/3waPXxCtHgupJ3ftQLPz8B9AQZ2xRXI0aoESMfzagOe8i4bcDZ4mH0iieF7Y6QqK7HYcWqhgOC0nqT+LiSDobsiSK+0qmyKjHE6Z2jzOEhX07pdUq9mtlL/Xp+UDEv0WK+ltynftXp04xLQ0Dt6IZL7n50mgbq17xjZbhGt9xi8er7FixMWk5xTTGBiMXdIeyfslFCPIj5rLUUCvFDu8DHJMODBteFMP51Cn5VX5GeZkRFOTTuAtQDP10i/NWZiy2qV1tPm2xG1AU/xqgG728Og4Ch8zLlIIdO+VDZRAeRsgHH741h4MZUqm1OBekNxV3OmKzA6k9im36gdeJkv9DRgkYkDZeSv2YX2xYrgUzI1dpP0MhV4t/Ydy829xvCTvqN49/N1Mr6bf1HZOz2QbutkNAGoJFME60Z6rjLSzSdUAdvm3vbbnX5GBgRHUyb3N1UG68aDdLVEsbvcDNwew9rIPBxi81WTAilTUjU2UOVw8UpQBBui87G6XOqeRnG/Fgc7Ig8llnoMuWWczijhVEYppzPLGtupzDKOZ5QSmlNOpVXL4APbY3N453Ace1JKqXc3d4XaUkV1LTOWbMHr/mHcLOO7Jsnz6jWKrr+bxHcbD5NlcfDWvlhuWyZAaMvsazU939n6ekdN/OaeAKNMtAt7J0yWFJBrzkJRJ+BF42fIkE6JMvjN1JwHiq0O/rrZSGB8MfVuEc/p9rJztdmW1P07EvMZujua17ZHMWRXJG/ujmrRBu6IYN65FEyZRRw4EcIFU6JMv43dH8vn59IosojN3XaerUldQlouAyd/I3cUZCJaA+/mviI4H86vX57N4QsRhJXU8duNJhlYt2b2990EePetMLA1Vtk73ef4H4H3cnAUAeasFspNAajAqbQ5eSlQ7DLkYnEJUVfx4N8neer+zy+kMmhHJH6mXPYkFbMrqYjdycXsES2piB0JhYQVVnMmIpkXxi3iyTc/ZVXwKS4mF5BQZpFlFu09W8+Xn7gURZ8XZ2j2rrnkieD8LV54+0viswrYllLC3X5X6HYNKZJ27FrftXOtvdY8r/nIWgMRJcLeqQS/jKvbTqMFtQOekhzhnIw/EMewvbEcvVpMRmWdzIxoN8mXze1h5O4o5l1Mo0LaPG3HvV32tSKJr6YitLvtDQ1MOZLAp2eTKbaKePHatOPIFX4lnI5fvsE9f3yXKXNXczk8UcZXirQwRHeMtGes2n6Kn/Yby81aPrMRvD6juLX3CCZ9uor82noWXMni58sutwvEXX4iphPbOSJ8aJnvFPd381cOjtzukQ6Nge7ewuERgJvk78R1cY/McfobeSU4kjKbo7FiQS62TpjYDngKdeGYnMoo461dMby6I5yRe2KZfiJRbqCK5KvyEGHhxasM3R1JZpXwNvVd9w6cBp3k4ARwLi17A+nVVgbvjMDfnEWd3AVvbxloEuq3k/98ZBxeWjrrlt7D+cMbn7B84yGu5hWrHmWaSOx8qH6q6uqYtXQrXj2HKrCagSc2Y29/fCLfrjkgyzhG7k/gZ+3Yux7SozTzxr547g8wSE+0tQRKsKQTEya90Lv9Q+m3KZo7RbzoIxLQYXT3C9MCfxP3BJj46GRKY7bqeqkNeI1Oh8eDq8FNREEVG2PzWXAxk7cPxPDMZgM7RE5R1qbAmewK+m8I5Uh6KU63S+28X1f9pQoN5P0aeIFxBby2PZzTGWWaW9++6qiptzFqth9e9w/lZs1eCc9RxG23PT6Bd+atIS4tW90sFpOmMxMzcnnt/aUyOBfZlBbg9RxJ7xdmcvCsEXNxHX/YaJY75C2AER7l8jBeCI6S20T91orwoNVOg0wwK2DEjvtdvgZeDI7grSOJdFseKrd8RLwowJXN10DPFQbWRWkbuTdAbcATzr7St8oN10nIR06tjQ+OJDB8V6R8LxhT43Qy4WAskw/HkV0jrmlxXieiJwWvWfyWUWNl1J4YPj2dQp6sKLu2+MakZPPn0QskWLf0GaOA6CNAHCt3CR56ZQanrsSom3UHCzgZEs2vB8yStq25syLBu384z45ZSOzVHHanlvLf/lfoqm3f6MAIFXmnr1HWzVzMq+SZrVF0keqwpeTpOcw7fEL5w6Yw1sfk8/ruKBnsq0S2UKcqthMS+MiaMAz5VY3jvV5qA56ehFahgbafJ2s0lS0JzavmzxsNnMwskyGEYPKFnEq5vfNNaKYsh1DqTg+w1XiaFKDu9DSFMdUON/PPXeW1bWbOZ5bJfKXO8PZI2Lv7nhNJZbVxKoD7iQBROB33D+W195eRnFEo71X9qL7W7DzNzx8Tm6+q5EEG5tLejebmXsMZ//EKCmqsfB2WxW3LLikAmjWhIu9daWLx5TSu1tTLlKDa51MAK+fDJLMt3Zcb6LnKgLcxA2NxLQ8FiFoVI91ElkZIn1S3wvaF8nxQOEWWjouN2qM24DVaeflepa9k3YkEEFKq7PxxQxg7kwplOkw6N8IRiMjh2U0GfE05lMhaTa0DYXYa7aDyVJWaVMgVW+wsC8ngxS1m1kXlarsE6vnZ1VZ2JhRJz3OZIZu1EdnkW518uWI3//XIOG4SSWWRk9SSyhKEPiOY/c1WamrFTrR4plo21RYrH3+3jZt6jeDmPmO18EBXuSP56aPjWbxiD3n1Tt4+LOxdCD38zC3B8zHQb304O5OKKLU5mH4ymduXidylqXEzVdgwoUrv9g5l3JE4ci026Sl3/U7YO7WjoLIuKmNzt38YU44lyLLB9kxER9QWvOakM1urR3Q0ePAx5fBSkJmIohrp2SnmeLA63XgbsuRu+SdnkrmcU06t2A1u6qxpUQC1TjuXciuYeTKJl7aa8DdmU2IV3laTmosqrubFbWZ6BoTwYnAkM07EY8orZ+KnK6SEKadD1Z7c0ldUf42ky+8msG7nqWbPVZSalc/rU5fjdZ9wbsZqalZsAY2Ryeiez89g7wkDkaV19N8czm3eSk029zZFuuuv22KILq2jzuHim5BMuiwX9k3ZPQFIF+GQeIfx2s5IjAUVcg/0swtiJ77J+VE7ESqtdu8KAwHhOW34cz3UIXgq6Ba1Keq9sbCaZzYZ8DZnU+cUeUw9z6jyizaPh6CYfAYHm3ljZwSfX7rK7qRiQvOqiC6uJrqompDcKlmkKuK513ZE8vrOKOmoVDvUDoG+ay/I4vaw4PJVnt5qYmNMAWV2D7FpuTw7ZoEMsvXNUyFxEryeI+j90iz2njHjcDfIKrF6h8rEHL8cxcMD5+B1v7B3OuCiKXv39OiFxKRmszetlF/6i7I8TUpaMDyMMQcTZOlGvdvN5th8VarnFyodD2H/fuEXyqiD8VzILpHPzaqxMmhXNF1abwtJ8ER8Z+RibmWnqbD2qEPwlN5UEmjzuJlzMlkeEMmssci8otxh94iddiWd+gAii2tZciWd4bujeX1nDGMPxjLhUALjDycz8kAsg3eYeWtPDIsvpxNTWqvVyeiptcYnS0qrtDJsdzRfXs5AwHD4jJHeMsge3qgyhfQIIESG5O6npjLm4zXM993DPJ9dfOG/hyXrDjJ8hi8/f2yCVJG39B0hq8VUyZ8INYYyepYvhTVWlhpzpB0TKS4Zo2nMFuAIKZl3IU3O0tnQwOH0Mn7lf0VmYQQ4/daa5T5jvEwuK/8hvKiGh1aLus8mx0fGglJaTTwfGE5+nU2LnG+MOgFPx85DlcPJy4FmFlzKoN6tpEQvPlKZ/bYrR6TPTmeUsiE6l+WGLJYZc1gXlcPZjDIK6toz0MqRESCqXQs1IVFG8PahBPLq3Xy7eh8/e3SCFmSLppwOsZkqmiyi/eUQvO55A6//fkP9f8/reN07hFvkxutYzVlRoYLo5//+ZjQL/LdTaHfLyuuffSvsmJI8WWDrJ9ShgYfXh7M1Lr9xrCEFVfx6tdj2CZPZqM0xudTJTJPijdXtYVdKKd2+axnsi/5Exdk9fmYmHYnD7tHqS1txozPqHDyNkSKbMudsMoN2RHAuqwKX2oxr9CzTqyycyCzlTGYpGZVWuTI7JiGxLrmVJGpZTmaUcbXKgktzQ0XwLopmz2aWMXCbWUpeUZ2DCZ+skqpP7X43ufo32nRP0+uBEdz3zIfsPHqJuHIrz2wR9k4rV/AVEqICcWHbngmKxihdemWfEstqGbI7UgIekidUn7js1g7iuKi0OfjiUgY/X9ZSZUrJ8w3jvgAzvsZM+TPl298YdQheo80Te2d4iK+oZcS+KAYHCwDLZcJapMWOpZfzwZF4Xgo28+o2E+8dSSQooYDSepXuUeVJ2qar9Ko80jnZlVTIB0cTGSTP8Zl491gih9JKKbfZ5WGW09nlvBFsZtz+KOLLLaRmF/Ps2IUqyJZSpxcOtYzZrqfpnqaIFf8y/HMikzI5nF4u601UvYooPTdJ6ZP5Te9QxuyPo8iqn3oS5Rv1nEwrIqdOi0v1Yl8tRSdOQA3ZFc3t2vZQk70T/YXx0NowWceq8/pGqVPw9JpMkW0RqympwsLYA9EMCjazPjqPBZfTeXaLmbf3RrEjoYDghEImH4nnsdWXCIorxOK0N9kzGfCpsGF1RB7PbjYy/lAcQfGFBMYXMGZ/LC8Emll0OYMVEXm8uj2cdw7GEFdaI8cTmZTBk8PmKbXYawQ39RopXX8RMsjWWzShCps13aFp0cbI6zcJO3n/EEbP8KWgysJ3plz+69vL3O6t6k5EUZGIzW73CeMX/qHMPZuCXXMKlVPV5E2rzJS2lSP3NVUJycOrwugiNmtbgSeC/WcCTeToR9ykvWjs7rqoQ/CU7laMl5lu7VxeRq2Vj47H8fzmcAYERbDCnEWxLIFXdk+8m3Q0kbH7YsiT8ZYATORo1OhK6l3y/N6881cptamjWOq6g4DwbAbtiOKpjSZmHE8iqVzUQSqqs9n4ImAvD/x1Onc++S53PDmF7n94l66/f5cuT0zm9t9N4rbfTuRnj03kp/0m8J+PvM1//Hos/+fBpgIj5Z2OkiXuokrs3x4cwXzv7ZQ5GvjsXCr3rwjhwTUm+q4x0nuNSZ4EEieEnthkZktMs7MI+q6/thjV4mw6G+Fwu9ifUkKXpefp6n2Fbt4hsraz6/IQGRv28A7l7UNxWPVDqo3HBK6fOgdPz7VokqO78aLwNaGsVlMjjbc3ZneC4/P5y2YD8aXK89LzmOImESO+sMXM3uQiXG4FqtjK1UEsrHOQVmnRNla1y1rHlRYbR86b8d90UCahv1l/kK/W7OfLVXv5wn8n83yC+XRZMLOWBPHRok1Mmb+GCZ8EMHpWACNmBPDWdD+GTfPhzanLGTRlqfQyj10Ix+rxcCatgPURWayNzGJFRBa+5iyWG3LkkbZVEVkklSkNoE9UOVcacM3GKThmdTo5mFzIsJ2RspRkyJ4Y3tgVJeO/gdvDZYi0OTJbpSKFKWlZzXFd1Al4fz/FlNbxxJrLHEwrbvSmZEhAAxujchiwPYLQgqrG5dH51qOgJoC/L1LuluizeULhWqQ7aR2T8hDcsg5IZE6sbjc1Lpf02CvsDlnqUGJ3qOqDZubkRqf2vwReg3STR+yOZuLRJHYkFXHsaqlsB9JKGLo7ig9PJpFbqx9pVtO9ntFLZsvVrekEeb5BsV5vek9NUDf/pLXGL9WzlX5pss362QuV62061Xt9S0xLNGiec4uUY6s7RawsF646BNn6hg7pfwU8fQgXcioYviuGv2wy89QmoyyF77/ByJCdsVzOrZb1GuLuplzn9QDYEoTmzFQ80pimbyrq7zUvt7n6Vk17rx8Dawa9Om8g1Lo69dP0m46oyU8QyQvp6OnPlqA2LRK51LQFcX2apyV9T+Cpx6rqZaWG9Mquyno7OTUWsqot5NVZyK2to8rhwKWpDHm/2DsUNTDy4KVa+cIWinN2wklyuzWnoJHZWk2NxmLlTOkMUX3q1/XxNUqC5nw53W7ZxDhcLu05HhdO+dmlvve45VZYY5/NtrcFCHL3Qx+VKJQViXoBmta/0hAaTxoTD2IGCkB1vemsf+NiU0PulL4X8GxOJ/Gp2ZwOjcMYl0GdtR6bw855YxzHzps4ciGcy+YE7HYr6bn5HL8cycGzZs6a4yksq8RWb8MYnUxGboGcSHFZFYaYFMoqq0nJyCU+NYe6erucdHZRCRdNCZwJiSUtuxCHyyl/F5eahcVqk6out6icC+GJ8qBIamYeNrsIV8Q/xaT8sgqOh0Sx74yRA6eNcpzF5eWk5xew76yZQ+fNcowpGcq7rK6zEpWYxamQGIyxqVTW1FJtqcMQk0pqVoEELTO3BFNMCi63h/ScYgyxqfK3DpedqzmFnAqJ44Ihgay8EinNTqedjNxizhpiOW+IJz2/BLdHLGCtzP06hPx7AS8uKZO/DPuU3w+exbMj5xGTmEVRZS19X5jKowNn0H/4PN6e40txeQ0L/XbR5/kP+eOQj+n93CS+CNgumT1ulg/zfXZQY61j/a7TjJ6+XFZ6LfQPZvqXa8ktKuVqbhHjP1lBv5c+5DcvfMCMLzeSX1KJ/+ZDTF2wiozcQlIyC5k8dy2PDviIx16ZyutTlnAqNFYbqeLGpfBYBkz8nC6Pj+P2fuMY/0kAYdEprAw8xc9+M5b+w+fy8sQFbNx3Rv5Rgg17zvH7wbPpN2AaL709j8Nnw0jMKODpoXMZ9v4ysgrKWL39JK9O+IJ6hwPvzQcZPHmhfFZkQgaDJ3zJoy9/xJ8Gz+ZvSzZgdTiJTM5i8OSveXzgNH7/6ixef28pCem5mmr9B4J3+JyJlyZ+xYEz4Rhir1JrtVJWXcfjr81gzc4zUlLS89TRp0W+O5n5dSCp2SUsWXOA0bO+IzO/iN3HDIyfGcCV8BQmfbaS5ZuOysP/X63ey5ylgRRVVDNveSCjPvImKbMAi8MupVaoVv+tx5m5JJCkrEIWrdjNyJl+8oRPldXO1C82MuVvayitUCGLsndQ73Dy2fKtfPjlOnWdBlYGHuelcQs5ExZHZGIGtVYbxpg03pyyhBVBJ6TcFlVUUlFTS1JGPk+NXsADf53KXO/trNhxnDc+WCJ3MQK2HWPY9OVY7Xbmem/j9clfY3O5qbHbyc4rpLauns++3cawKUuptbvkQh89w4dZCzdqGkIfZ8fofS/gVdZYWey/k6eHf8Ifh/6NS8YEiitqeHzQHB57dQZPvjEb/80HsNkdLF69nyeGzOW5cV/w8AvT8N54iJp6i5TKcTP9+XDRZoZ8uIzTV6Jl34tW7ueTb4MoKK3gvXkrJaMqLerIr7BVgvy2nGD2kiBiUrKYs3Qrs74JpKZOVZ8t23yYdz5dSUZOsfysuwU1FiufLt3CtC/Wys8iBRgQeILuvx1N/yEf8fac5UQmpHPJlMiQD77jtDFB3ueWBcgNxKXkMGb2Svmsv46ez8DJSxk+7Ts5x4BtRxn+0TKq6ixMnreaz5btUs8QdtLloqyqmolzV7LQf6e8Xm+zs2zjEbkwXXKDW7ek/wDwMnKKOBUSS/TVAp4fu4Bv1x8gvaCU3w+axf5L0WSXVZFbKhK3DSz038v4T1cx+9utvPz2Ys4bE5SbLM49rNnHL/70Lu/OX0dOYZm8tmjFXmZ/E0RRWTVrth9j8JTFbD8WyuWIZM6ERlNZU8OKoJPM/CqQqzklrNt1iqHvL2XnMQNnTUmMmbmc+cu3SpvZnGos9cxZuokPvlgtPwvP1z/wGG9+sJT0wnLySivl7nt8WjbjP/Zj+uJNhCdmcvJSFDHJGcSn5TBuTgC7T4Sw7eBluj42lqHTlkmJXhl0jLemfSf7XBl8nGeGz+diRAqXIpM5fi6caosNvy3HeG7EfM6Gp3A6LIZXxy/Cd/NRbXnpIck/ADxhuN+Y8jWPvfwBz438G6b4dIqranlx7Dz6PjeRvs+/y8C355JTWIzPpgN8t24fBWXVfLx4PV/6BlFUqv5+iTn+Kq9NmMu2Q+dxyONb4LvpIF+t2EFBSRn1Dhdfr95Hv1em8uCzk5i7bAuF5VVs3XeWRb7byC0socZq59t1h3hswDQeeu5dZn+1iYzctn9ZQWzULlkZzPxlG+VnkczZtOc8v/rTRB587l2eGPQhfht2y+8um5MZNGEBDzwzgYHjv+RMaAxpWfnM+GINFwzRVFkszFsexHuf+MhjZ1v3nmTK35bL3xaWVTH76y088OwkfjvgQ75ZuQeby0VxZTWfLt3Gr5//gEdfeZ+53sFU1QttoUohr0Nrfh/giScIUUcad7UV1IDH7aG6vp4Ki5Vyi4UqS70sm7A6HfI+4Vrb3C6q6q043KpoSaw3kXUQLrpSHB65kq0OV+NWkSDxu3oNXPEsm+zTKTMaOjldbukFq/k3uew6iefXiT9kJwqmZFjjkv1UWOopl2Oux+IQf7NCcVG8rA57Y1Gv6L/WbpPeruC0Qxx2sau/TSOeWyMOSDamDYRH7tDOE4rumirzRBpN3K9IFXpJuWseNlyDvgfwNJ5q6R0xSZE10FNhmvXVAG76G2R63KMOVTTLE8ofqEMrHnnUSQ9kVVWbSmWp/gTD1R8MkQNQLJb96DZD9d9xXkR8J2JOEZepz7Jv1WVj3Kn4qIJsPTaT6l4coZLnCrXgW3uuWoxaUC6Li7UOGxTYqonxqwBdnHBq4WXqrQP6fsDTM+zygc0Hq/5Xf8CqaVo6W9XkmgLYJvD03+mJcL0vVVWqM0kxVQElf6dNuJGR4r2+sFpxokmeRI/Nx6Q9RWekdk+TBKpxNCUE9NRZ4+3aMHTgmtXANo5Pf3Lzp2tX5UC0RdhixG3p+wHvR/qn0I/g/YDpR/B+wPQjeD9g+hG8HzD9f7WNn6FqqVdXAAAAAElFTkSuQmCC';
    const firmaBase64 = 'data:image/png;base64,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';


    let y = margin-3;
    
    // =======================================
    // ENCABEZADO: FECHA, TÍTULO Y LOGO
    // =======================================
    
    // Fecha (izquierda arriba) - MÁS OSCURA
    doc.setFontSize(9);
    doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
    doc.setFont(undefined, 'bold');
    doc.text('FECHA:', margin, y + 3);
    
    const fechaObj = new Date(datos.fecha + 'T00:00:00');
    const dia = fechaObj.getDate().toString().padStart(2, '0');
    const mesNum = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
    const anio = fechaObj.getFullYear();
    doc.setFont(undefined, 'normal');
    doc.text(`${dia}/${mesNum}/${anio}`, margin, y + 8);
    
    // Título principal CENTRADO
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
    doc.text('REPORTE DE SERVICIO TÉCNICO', pageWidth / 2, y + 6, { align: 'center' });
    
    // Logo (derecha arriba)
    try {
        doc.addImage(logoBase64, 'PNG', pageWidth - margin - 25, y - 9, 29, 20);
    } catch (e) {
        console.log('Error cargando logo');
    }
    
    y += 12;
    
    // LÍNEA HORIZONTAL debajo del encabezado
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 3;
    
    // =======================================
    // DATOS DE LA INSTITUCIÓN Y EQUIPO
    // =======================================
    
    const col1X = margin;
    const col1Width = 90;
    const col2X = col1X + col1Width + 5;
    const col2Width = pageWidth - margin - col2X;
    const sectionHeight = 48;
    
    // Rectángulo 1: DATOS DE LA INSTITUCIÓN
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(col1X, y, col1Width, sectionHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.roundedRect(col1X, y, col1Width, sectionHeight, 3, 3, 'S');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
    doc.text('DATOS DE LA INSTITUCIÓN / PROPIETARIO', col1X + 3, y + 5);
    
    doc.setFontSize(7);
    let yInterno = y + 9;
    
    doc.setFont(undefined, 'bold');
    doc.text('NOMBRE:', col1X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    const nombreLineas = doc.splitTextToSize(datos.cliente.nombre, col1Width - 6);
    doc.text(nombreLineas[0] || '', col1X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('DIRECCION:', col1X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    const dirLineas = doc.splitTextToSize(datos.cliente.direccion, col1Width - 6);
    doc.text(dirLineas[0] || '', col1X + 3, yInterno + 4);
    if (dirLineas[1]) {
        doc.text(dirLineas[1], col1X + 3, yInterno + 7);
    }
    
    yInterno += dirLineas.length > 1 ? 11 : 8;
    doc.setFont(undefined, 'bold');
    doc.text('TELEFONO:', col1X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.cliente.telefono, col1X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('CORREO ELECTRÓNICO:', col1X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    const correoLineas = doc.splitTextToSize(datos.cliente.correo, col1Width - 6);
    doc.text(correoLineas[0] || '', col1X + 3, yInterno + 4);
    
    // Rectángulo 2: DATOS DEL EQUIPO
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(col2X, y, col2Width, sectionHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(col2X, y, col2Width, sectionHeight, 3, 3, 'S');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('DATOS DEL EQUIPO', col2X + 3, y + 5);
    
    doc.setFontSize(7);
    yInterno = y + 9;
    
    doc.setFont(undefined, 'bold');
    doc.text('EQUIPO:', col2X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.equipo.nombre.substring(0, 50), col2X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('MARCA:', col2X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.equipo.marca, col2X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('MODELO:', col2X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.equipo.modelo, col2X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('SERIE:', col2X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.equipo.serie, col2X + 3, yInterno + 4);
    
    yInterno += 8;
    doc.setFont(undefined, 'bold');
    doc.text('UBICACIÓN:', col2X + 3, yInterno);
    doc.setFont(undefined, 'normal');
    doc.text(datos.equipo.ubicacion, col2X + 3, yInterno + 4);
    
    y += sectionHeight + 3;
    
    // =======================================
    // FILA DE 3 SECCIONES
    // =======================================
    
    const col3Width = (pageWidth - 2 * margin - 10) / 3;
    const sectionHeight2 = 41;
    
    // SERVICIO POR
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(col1X, y, col3Width, sectionHeight2, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('SERVICIO POR:', col1X + 3, y + 5);
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    let yCheck = y + 9;
    
    dibujarCheckboxMejorado(doc, col1X + 3, yCheck, datos.servicioPor === 'CONTRATO');
    doc.text('CONTRATO', col1X + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col1X + 3, yCheck, datos.servicioPor === 'EVENTO');
    doc.text('EVENTO', col1X + 8, yCheck + 3);
    
    yCheck += 8;
    doc.setFont(undefined, 'bold');
    doc.text('ESTADO ACTUAL DEL EQUIPO:', col1X + 3, yCheck);
    doc.setFont(undefined, 'normal');
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col1X + 3, yCheck, datos.estadoEquipo === 'FUNCIONANDO');
    doc.text('FUNCIONANDO', col1X + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col1X + 3, yCheck, datos.estadoEquipo === 'CON FALLA');
    doc.text('CON FALLA', col1X + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col1X + 3, yCheck, datos.estadoEquipo === 'FUERA DE SERVICIO');
    doc.text('FUERA DE SERVICIO', col1X + 8, yCheck + 3);
    
    // MOTIVO DEL SERVICIO
    const col2Xnew = col1X + col3Width + 5;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(col2Xnew, y, col3Width, sectionHeight2, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('MOTIVO DEL SERVICIO:', col2Xnew + 3, y + 5);
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    yCheck = y + 9;
    
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'PREVENTIVO');
    doc.text('MTO PREVENTIVO', col2Xnew + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'CORRECTIVO');
    doc.text('MTO CORRECTIVO', col2Xnew + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'DIAGNOSTICO');
    doc.text('DIAGNÓSTICO', col2Xnew + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'INSTALACION');
    doc.text('INSTALACIÓN', col2Xnew + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'DESINSTALACION');
    doc.text('DESINSTALACIÓN', col2Xnew + 8, yCheck + 3);
    
    yCheck += 5;
    dibujarCheckboxMejorado(doc, col2Xnew + 3, yCheck, datos.tipoMto === 'BAJADELEQUIPO');
    doc.text('BAJA DEL EQUIPO', col2Xnew + 8, yCheck + 3);
    
    // ESTADO DE ACCESORIOS
    const col3X = col2Xnew + col3Width + 5;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(col3X, y, col3Width, sectionHeight2, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(col3X, y, col3Width, sectionHeight2, 3, 3, 'S');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('ESTADO DE ACCESORIOS:', col3X + 3, y + 5);
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    yCheck = y + 10;
    
    if (datos.accesoriosEstado && datos.accesoriosEstado.length > 0) {
        datos.accesoriosEstado.slice(0, 7).forEach(acc => {
            const texto = `${acc.nombre.substring(0, 60)}: ${acc.estado}`;
            doc.text(texto, col3X + 3, yCheck);
            yCheck += 4;
        });
    } 
    
    y += sectionHeight2 + 3;
    
    // =======================================
    // TAREAS EJECUTADAS (CHECKBOXES CORREGIDOS)
    // =======================================
    
    const tareasHeight = 35;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, tareasHeight, 3, 3, 'FD');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('TAREAS EJECUTADAS:', margin + 3, y + 5);
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    
    const tareasList = [
        ['AJUSTE', 'TEST TEMPERATURA'],
        ['CONFIGURACIÓN', 'LIMPIEZA INTERNA'],
        ['REPARACIÓN', 'LIMPIEZA EXTERNA'],
        ['EVALUACIÓN', 'VERIFICACION DE FUGAS'],
        ['LUBRICACIÓN', '']
    ];
    
    let yTarea = y + 10;
    
    tareasList.forEach(fila => {
        // Columna 1
        if (fila[0]) {
            const isChecked1 = datos.tareas.includes(fila[0]);
            dibujarCheckboxMejorado(doc, margin + 3, yTarea, isChecked1);
            doc.text(fila[0], margin + 8, yTarea + 3);
        }
        
        // Columna 2
        if (fila[1]) {
            const isChecked2 = datos.tareas.includes(fila[1]);
            dibujarCheckboxMejorado(doc, margin + 3 + 90, yTarea, isChecked2);
            doc.text(fila[1], margin + 8 + 90, yTarea + 3);
        }
        
        yTarea += 5;
    });
    
    y += tareasHeight + 3;
    
    // =======================================
    // VERIFICACIÓN DE PARÁMETROS
    // =======================================

if (datos.verificacionParametros.tipo === 'LAMPARA') { 
    
    const paramHeight = 27;            // REGRESA A TU ALTURA ORIGINAL DEL RECUADRO
    const innerMargin = 3;            // MARGEN INTERNO DEL TEXTO
    const spacing = 8;                // ESPACIO ENTRE TÍTULO Y CONTENIDO

    // ---- Recuadro azul ----
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'S');

    // ---- Título dentro del recuadro ----
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('VERIFICACION DE PARAMETROS', margin + innerMargin, y + 5);

    // ---- Posición inicial del contenido ----
    let yLine = y + spacing;

    // ---- Columnas con margen interno ----
    const col1X = margin + innerMargin;      // ahora 3 px desde borde
    const col2X = margin + innerMargin + 65; // ajustado a nuevo margen

    // ---- LETRA MÁS PEQUEÑA ----
    doc.setFontSize(6.5);

    // =====================================
    //     COLUMNA 1 — DATOS EQUIPO PATRÓN
    // =====================================

    doc.setFont(undefined, 'bold');
    doc.text('DATOS EQUIPO PATRÓN', col1X, yLine);
    yLine += 5;

    doc.text('EQUIPO:', col1X, yLine);
    doc.setFont(undefined, 'normal');
    doc.text('RADIÓMETRO', col1X + 20, yLine);
    yLine += 4;

    doc.setFont(undefined, 'bold');
    doc.text('MARCA:', col1X, yLine);
    doc.setFont(undefined, 'normal');
    doc.text('WOODPECKER', col1X + 20, yLine);
    yLine += 4;

    doc.setFont(undefined, 'bold');
    doc.text('MODELO:', col1X, yLine);
    doc.setFont(undefined, 'normal');
    doc.text('LM-1', col1X + 20, yLine);
    yLine += 4;

    doc.setFont(undefined, 'bold');
    doc.text('SERIE:', col1X, yLine);
    doc.setFont(undefined, 'normal');
    doc.text('M2281244L', col1X + 20, yLine);

    // =====================================
    //     COLUMNA 2 — RESULTADOS
    // =====================================

    let yLine2 = y + spacing;

    doc.setFont(undefined, 'bold');
    doc.text('RESULTADOS', col2X, yLine2);
    yLine2 += 5;

    doc.text('MEDIDA 1                  MEDIDA 2', col2X, yLine2);
    yLine2 += 4;

    doc.setFont(undefined, 'normal');

    datos.verificacionParametros.medidas.forEach((m, index) => {
        const valor1 = m.medida1 || '-';
        const valor2 = m.medida2 || '-';

        // Columna 2 → MEDIDA 1
        doc.text(`${valor1} mW/cm2`, col2X, yLine2, { align: 'left' });

        // Columna 2 → MEDIDA 2 (ajustada a 45 px de separación)
        doc.text(`${valor2} mW/cm2`, col2X + 23, yLine2, { align: 'left' });

        yLine2 += 4; // espacio entre filas
    });
    y = y + paramHeight + 3;
}

 else if (datos.verificacionParametros.tipo === 'INCUBADORA') {
        const paramHeight = 27;            // REGRESA A TU ALTURA ORIGINAL DEL RECUADRO
        const innerMargin = 3;            // MARGEN INTERNO DEL TEXTO
        const spacing = 8;                // ESPACIO ENTRE TÍTULO Y CONTENIDO

        // ---- Recuadro azul ----
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'F');
        doc.setDrawColor(150, 150, 150);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'S');

        // ---- Título dentro del recuadro ----
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('VERIFICACION DE PARAMETROS', margin + innerMargin, y + 5);

        // ---- Posición inicial del contenido ----
        let yLine = y + spacing;

        // ---- Columnas con margen interno ----
        const col1X = margin + innerMargin;      // ahora 3 px desde borde
        const col2X = margin + innerMargin + 65; // ajustado a nuevo margen

        // ---- LETRA MÁS PEQUEÑA ----
        doc.setFontSize(6.5);

        // =====================================
        //     COLUMNA 1 — DATOS EQUIPO PATRÓN
        // =====================================

        doc.setFont(undefined, 'bold');
        doc.text('DATOS EQUIPO PATRÓN', col1X, yLine);
        yLine += 5;

        doc.text('EQUIPO:', col1X, yLine);
        doc.setFont(undefined, 'normal');
        doc.text('MULTIMETRO', col1X + 20, yLine);
        yLine += 4;

        doc.setFont(undefined, 'bold');
        doc.text('MARCA:', col1X, yLine);
        doc.setFont(undefined, 'normal');
        doc.text('MESTEIK', col1X + 20, yLine);
        yLine += 4;

        doc.setFont(undefined, 'bold');
        doc.text('MODELO:', col1X, yLine);
        doc.setFont(undefined, 'normal');
        doc.text('CM83E', col1X + 20, yLine);
        yLine += 4;

        doc.setFont(undefined, 'bold');
        doc.text('SERIE:', col1X, yLine);
        doc.setFont(undefined, 'normal');
        doc.text('24040012564', col1X + 20, yLine);

        // =====================================
        //     COLUMNA 2 — RESULTADOS
        // =====================================

        let yLine2 = y + spacing;

        doc.setFont(undefined, 'bold');
        doc.text('RESULTADOS', col2X, yLine2);
        yLine2 += 5;

        doc.text('MEDIDA 1                  MEDIDA 2', col2X, yLine2);
        yLine2 += 4;

        doc.setFont(undefined, 'normal');

        datos.verificacionParametros.medidas.forEach((m, index) => {
            const valor1 = m.medida1 || '-';
            const valor2 = m.medida2 || '-';

            // Columna 2 → MEDIDA 1
            doc.text(`${valor1} °C`, col2X, yLine2, { align: 'left' });

            // Columna 2 → MEDIDA 2 (ajustada a 45 px de separación)
            doc.text(`${valor2} °C`, col2X + 23, yLine2, { align: 'left' });

            yLine2 += 4; // espacio entre filas
        });
        y = y + paramHeight + 3;
        
    } else {
        // TEXTO NORMAL (para otros equipos)
        const paramHeight = 22;
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'F');
        doc.setDrawColor(150, 150, 150);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, paramHeight, 3, 3, 'S');
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('VERIFICACION DE PARAMETROS', margin + 3, y + 5);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        if (datos.verificacionParametros.texto) {
            const lineasObs = doc.splitTextToSize(datos.verificacionParametros.texto, pageWidth - 2 * margin - 6);
            doc.text(lineasObs, margin + 3, y + 10);
        }
        
        y += paramHeight + 3;
    }
    
    // =======================================
    // FALLA REPORTADA
    // =======================================
    
    const fallaHeight = 16;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, fallaHeight, 3, 3, 'FD');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('FALLA REPORTADA:', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    if (datos.fallaReportada) {
        const lineasFalla = doc.splitTextToSize(datos.fallaReportada, pageWidth - 2 * margin - 6);
        doc.text(lineasFalla, margin + 3, y + 10);
    }
    
    y += fallaHeight + 3;
    
    // =======================================
    // ACTIVIDAD DE MANTENIMIENTO
    // =======================================
    
    const actHeight = 28;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, actHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, actHeight, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('ACTIVIDAD DE MANTENIMIENTO:', margin + 3, y + 5);
    
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    const lineasAct = doc.splitTextToSize(datos.actividadMantenimiento, pageWidth - 2 * margin - 6);
    doc.text(lineasAct, margin + 3, y + 10);
    
    y += actHeight + 3;
    
    // =======================================
    // OBSERVACIONES
    // =======================================
    
    const obsHeight = 16;
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, obsHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, obsHeight, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('OBSERVACIONES:', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    if (datos.observaciones) {
        const lineasObs = doc.splitTextToSize(datos.observaciones, pageWidth - 2 * margin - 6);
        doc.text(lineasObs, margin + 3, y + 10);
    }
    
    y += obsHeight + 3;
    
    // =======================================
    // FIRMAS
    // =======================================
    
    const firmaHeight = 32;
    
    // SERVICIO REALIZADO POR
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, col1Width, firmaHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, col1Width, firmaHeight, 3, 3, 'S');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('SERVICIO REALIZADO POR:', margin + 3, y + 5);
    
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('JORGE IVAN MEJIA MONTAÑO', margin + 3, y+2 + 11);
    doc.text('INGENIERO DE SERVICIO', margin + 3, y+2 + 15);
    doc.text('REG INVIMA RH-202010-00277', margin + 3, y+2 + 19);
    
    // Agregar firma
    try {
        doc.addImage(firmaBase64, 'PNG', margin + 45, y + 9, 35, 14);
    } catch (e) {
        console.log('Error cargando firma');
    }
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(col1X + 45, y + 24, col1X + col1Width - 10, y + 24);

    doc.setFontSize(6);
    doc.text('FIRMA', margin + 57, y + 27);
    
    // SERVICIO RECIBIDO Y APROBADO POR
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(col2X, y, col2Width, firmaHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(col2X, y, col2Width, firmaHeight, 3, 3, 'S');
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('SERVICIO RECIBIDO Y APROBADO', col2X + 3, y + 5);
    
    // Línea para firma
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(col2X + 10, y + 24, col2X + col2Width - 10, y + 24);
    
    doc.setFontSize(6);
    doc.setFont(undefined, 'normal');
    doc.text('FIRMA', col2X + (col2Width / 2) - 4, y + 27);
    
    // =======================================
    // EVIDENCIA FOTOGRÁFICA
    // =======================================
    
    if (fotosSeleccionadas.length > 0) {
        doc.addPage();
        let yFoto = margin + 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('EVIDENCIA FOTOGRÁFICA', pageWidth / 2, yFoto, { align: 'center' });
        
        yFoto += 10;
        
        let xFoto = margin;
        let fotosPorFila = 0;
        
        for (let i = 0; i < fotosSeleccionadas.length; i++) {
            if (yFoto > pageHeight - 100) {
                doc.addPage();
                yFoto = margin + 10;
                xFoto = margin;
                fotosPorFila = 0;
            }
            
            try {
                doc.addImage(fotosSeleccionadas[i], 'JPEG', xFoto, yFoto, 85, 85);
            } catch (e) {
                console.log('Error agregando foto');
            }
            
            fotosPorFila++;
            if (fotosPorFila === 2) {
                yFoto += 95;
                xFoto = margin;
                fotosPorFila = 0;
            } else {
                xFoto = pageWidth / 2 + 5;
            }
        }
    }
    
    // Descargar
    const nombreArchivo = `Reporte_${datos.cliente.nombre}_${datos.equipo.nombre}_${datos.fecha}.pdf`.replace(/ /g, '_');
    doc.save(nombreArchivo);
    
}

// Función auxiliar MEJORADA para dibujar checkbox con X
function dibujarCheckboxMejorado(doc, x, y, marcado) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(x, y, 3, 3);
    
    if (marcado) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        // Dibujar X
        doc.line(x + 0.5, y + 0.5, x + 2.5, y + 2.5);
        doc.line(x + 2.5, y + 0.5, x + 0.5, y + 2.5);
    }
}

// ============================================
// EDITAR EQUIPOS
// ============================================

window.abrirModalEditarEquipo = function(id) {
    db.collection('equipos').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const equipo = doc.data();
                document.getElementById('editEquipoId').value = id;
                document.getElementById('editEquipoNombre').value = equipo.nombre;
                document.getElementById('editEquipoMarca').value = equipo.marca;
                document.getElementById('editEquipoModelo').value = equipo.modelo;
                document.getElementById('editEquipoSerie').value = equipo.serie;
                document.getElementById('editEquipoUbicacion').value = equipo.ubicacion;
                document.getElementById('editEquipoAccesorios').value = equipo.accesorios.join(', ');
                
                // Cargar clientes en el select
                db.collection('clientes').orderBy('nombre').get()
                    .then((querySnapshot) => {
                        const select = document.getElementById('editEquipoCliente');
                        select.innerHTML = '<option value="">-- Cliente --</option>';
                        
                        querySnapshot.forEach((clienteDoc) => {
                            const cliente = clienteDoc.data();
                            const option = document.createElement('option');
                            option.value = clienteDoc.id;
                            option.textContent = cliente.nombre;
                            if (clienteDoc.id === equipo.clienteId) {
                                option.selected = true;
                            }
                            select.appendChild(option);
                        });
                    });
                
                document.getElementById('modalEditarEquipo').style.display = 'block';
            }
        });
}

window.cerrarModalEquipo = function() {
    document.getElementById('modalEditarEquipo').style.display = 'none';
}

document.getElementById('formEditarEquipo').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editEquipoId').value;
    const accesoriosTexto = document.getElementById('editEquipoAccesorios').value;
    const accesoriosArray = accesoriosTexto ? accesoriosTexto.split(',').map(a => a.trim()) : [];
    
    const equipoActualizado = {
        nombre: document.getElementById('editEquipoNombre').value,
        marca: document.getElementById('editEquipoMarca').value,
        modelo: document.getElementById('editEquipoModelo').value,
        serie: document.getElementById('editEquipoSerie').value,
        ubicacion: document.getElementById('editEquipoUbicacion').value,
        accesorios: accesoriosArray
    };
    
    db.collection('equipos').doc(id).update(equipoActualizado)
        .then(() => {
            alert('Equipo actualizado exitosamente');
            cerrarModalEquipo();
            cargarEquipos();
        })
        .catch((error) => {
            alert('Error al actualizar equipo: ' + error.message);
        });
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modalCliente = document.getElementById('modalEditarCliente');
    const modalEquipo = document.getElementById('modalEditarEquipo');
    if (event.target == modalCliente) {
        cerrarModalCliente();
    }
    if (event.target == modalEquipo) {
        cerrarModalEquipo();
    }
}

// ============================================
// AUTO-LLENAR ACTIVIDAD DE MANTENIMIENTO (MEJORADO)
// ============================================

// Leyendas preestablecidas para cada tipo de mantenimiento
const leyendasMantenimiento = {
    'PREVENTIVO': 'SE REALIZÓ MANTENIMIENTO PREVENTIVO DEL EQUIPO, INCLUYENDO LIMPIEZA, LUBRICACIÓN, VERIFICACIÓN DE CONEXIONES Y PRUEBAS DE FUNCIONAMIENTO. EQUIPO VERIFICADO Y EN ÓPTIMAS CONDICIONES DE OPERACIÓN.',
    'CORRECTIVO': 'SE REALIZÓ DIAGNÓSTICO Y REPARACIÓN DE LAS FALLAS REPORTADAS. EQUIPO PROBADO Y VERIFICADO PARA CONFIRMAR CORRECTO FUNCIONAMIENTO.',
    'DIAGNOSTICO': 'SE REALIZÓ DIAGNÓSTICO TÉCNICO COMPLETO DEL EQUIPO PARA IDENTIFICAR POSIBLES FALLAS O ANOMALÍAS. VER REPORTE DE VERIFICACIÓN DE PARÁMETROS.',
    'INSTALACION': 'SE REALIZÓ LA INSTALACIÓN DEL EQUIPO DE ACUERDO A LAS ESPECIFICACIONES DEL FABRICANTE Y NORMAS TÉCNICAS APLICABLES.',
    'DESINSTALACION': 'SE REALIZÓ LA DESINSTALACIÓN DEL EQUIPO. EQUIPO EMPACADO Y LISTO PARA TRASLADO O DISPOSICIÓN FINAL.',
    'BAJADELEQUIPO': 'SE REALIZÓ LA BAJA DEL EQUIPO DEL INVENTARIO. NO APTO PARA REPARACIÓN O FUNCIONALIDAD.'
};

// Leyendas específicas para PREVENTIVO por tipo de equipo
const leyendasPreventivoEspecificas = {
    'UNIDAD ODONTOLÓGICA': 'SE REALIZA DESARME PARCIAL DEL EQUIPO PARA LIMPIEZA DE SUPERFICIES Y DEL SISTEMA ELÉCTRICO, ELECTRÓNICO Y MECÁNICO. SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, MOTORES, JERINGA TRIPLE, EYECTOR DE ALTA Y BAJA, ESCUPIDERA, HOLDERS AUTOMÁTICOS, PEDALES NEUMÁTICOS, LÁMPARA AUXILIAR, SISTEMA HIDRÁULICO Y SISTEMA NEUMÁTICO. SE VERIFICA ESTADO DEL SILLÓN Y TAPIZADO DEL MISMO. SE LUBRICAN JUNTAS, EJES DE LOS MOTORES Y DEMÁS PARTES MÓVILES. SE VERIFICA EL CORRECTO AJUSTE DE MANGUERAS, RACORES, SEGUROS Y CONEXIONES ELÉCTRICO/ELECTRÓNICAS. SE VERIFICA Y REGULA PRESIÓN DE SALIDA DE AIRE EN LAS PIEZAS DE MANO CON AYUDA DE UN MANÓMETRO.',
    
    'COMPRESOR': 'SE REALIZA LIMPIEZA EXTERNA Y VERIFICACIÓN FUNCIONAL DEL TANQUE, MOTORES, PRESOSTATO Y REGULADOR DE AIRE. SE VERIFICA ESTADO INTEGRAL DEL MECANISMO INTERNO DE LOS MOTORES (CILINDRO, BIELA, PISTÓN, ANILLOS). SE REALIZA LIMPIEZA DE LOS FILTROS DE ADMISIÓN DE AIRE. SE VERIFICA EL ESTADO FUNCIONAL DE LA VÁLVULA SELENOIDE DE ALIVIO. SE VERIFICA AUSENCIA DE FUGA DE AIRE EN ACOPLES Y RACORES. SE REALIZA PURGA DE SISTEMA, SE REALIZA CICLO DE DESCARGA Y CARGA.',
    
    'AUTOCLAVE': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO; SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CÁMARA, CIRCUITO ELECTRÓNICO, CIRCUITO NEUMÁTICO, CIRCUITO HIDRÁULICO, SENSORES DE TEMPERATURA, DRENAJE, MANÓMETRO, INDICADORES Y BOTONES. SE REALIZA AJUSTE DE CONECTORES, RACORES Y VÁLVULAS. SE REALIZA LIMPIEZA DEL FILTRO DE CÁMARA, REJILLAS Y BANDEJAS. SE REALIZA PRUEBA DE CALENTAMIENTO, ESTERILIZACIÓN Y SECADO.',
    
    'LÁMPARA DE FOTOCURADO': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO; SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, BASE DE CARGA, CUERPO DE LA LÁMPARA, FIBRA Y FILTRO. SE VERIFICA EL ESTADO DEL PUERTO DE CARGA Y DEL CIRCUITO ELECTRÓNICO DE LA BASE. SE REALIZA DESARME PARCIAL DEL CUERPO Y SE VERIFICA EL ESTADO Y FUNCIONAMIENTO DEL CIRCUITO, BOTONES Y LEDS INDICADORES.',
    
    'ELECTROBISTURI': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DE LA CONSOLA PRINCIPAL. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, BOTONES, INDICADORES Y PUERTOS DE CONEXIÓN. SE VERIFICA EL ESTADO FÍSICO Y FUNCIONAL DEL PEDAL Y DE LA PIEZA DE MANO. SE REALIZA PRUEBA DE FUNCIONAMIENTO, CORTE Y COAGULACIÓN.',
    
    'INCUBADORA': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA; SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, VÁLVULAS E INDICADORES. SE VERIFICA EL ESTADO DEL CABLE DE ALIMENTACIÓN ELÉCTRICA. SE VERIFICA EL ESTADO DE LA RESISTENCIA Y SE REALIZA PRUEBA DE MEDIDA PARA VERIFICAR LA ESTABILIDAD DE LA TEMPERATURA.',
    
    'LÁMPARA DE BLANQUEAMIENTO': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA EL ESTADO DE LA CARCASA, CIRCUITO ELECTRÓNICO DEL MÓDULO DE CONFIGURACIÓN, DISPLAY Y BOTONES. SE VERIFICA EL ESTADO FUNCIONAL DEL CABEZAL, CIRCUITO ELECTRÓNICO, LEDS Y UNIDAD DE TRANSPORTE. ',
    
    'LAVADORA ULTRASONICA': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DE LA CONSOLA PRINCIPAL. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, TANQUE, PARRILLA, DISPLAY Y BOTONES. SE REALIZA DESARME PARCIAL PARA VERIFICAR EL ESTADO DE LA RESISTENCIA DE CALEFACCIÓN Y DEL MÓDULO GENERADOR DE FRECUENCIA.',

    'LOCALIZADOR APICAL': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, BOTONES, DISPLAY Y PERIFÉRICOS EXTERNOS. SE REALIZA PRUEBA DE FUNCIONAMIENTO EN SITIO.',

    'MÁQUINA DE SEDACIÓN': 'SE REALIZA LIMPIEZA EXTERNA DEL EQUIPO. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, MANÓMETROS Y PERILLAS DE DOSIFICACIÓN. SE VERIFICA EL ESTADO FÍSICO Y FUNCIONAL DE LOS REGULADORES DE LOS TANQUES. SE VERIFICA EL ESTADO FUNCIONAL DE LA UNIDAD DE TRANSPORTE.',

    'MÁQUINA DE VACIO': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, SWITCH DE ENCENDIDO, CIRCUITO ELÉCTRICO/ELECTRÓNICO, RESISTENCIA Y FUSIBLE. SE VERIFICA EL CORRECTO FUNCIONAMIENTO DEL MECANISMO DE ACTIVACIÓN DEL MOTOR; A SU VEZ, SE VERIFICA EL CORRECTO FUNCIONAMIENTO DEL MOTOR AL MOMENTO DE REALIZAR EL VACÍO. SE VERIFICA EL ESTADO DEL MECANISMO DE SUJECIÓN DE LA BANDEJA.',

    'PIEZA DE MANO DE ALTA VELOCIDAD': 'SE REALIZA LIMPIEZA EXTERNA. SE VERIFICA EL ESTADO DE LA CARCASA Y DEL CABEZAL. SE REALIZA DESARME PARCIAL PARA VERIFICAR EL ESTADO DE LA TURBINA, DEL MECANISMO DE AJUSTE Y SUJECIÓN DE LA FRESA, Y DE LOS CONDUCTOS DE IRRIGACIÓN. SE LUBRICAN LAS PARTES MÓVILES.',

    'PIEZA DE MANO DE BAJA VELOCIDAD': 'SE REALIZA LIMPIEZA EXTERNA. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA. SE REALIZA DESARME PARCIAL DEL MICROMOTOR NEUMÁTICO, CONTRAÁNGULO Y PIEZA RECTA PARA VERIFICAR EL ESTADO DEL MECANISMO INTERNO DE CADA UNO. SE LUBRICAN LAS PARTES MÓVILES, SE REVISA EL ESTADO DE LOS RODAMIENTOS, SE ENSAMBLA Y SE REALIZA PRUEBA DE FUNCIONAMIENTO EN CONJUNTO.',

    'PROPHY JET': 'SE REALIZA LIMPIEZA EXTERNA DEL EQUIPO. SE REALIZA DESARME PARCIAL DE LA CÁPSULA Y LA PUNTA PARA VERIFICAR EL MECANISMO DE SUJECIÓN Y LOS CONDUCTOS DE IRRIGACIÓN. SE REALIZA LIMPIEZA INTERNA DE LOS CONDUCTOS O VÍAS DE IRRIGACIÓN. SE VERIFICA EL FUNCIONAMIENTO.',

    'SELLADORA': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA. SE REALIZA DESARME PARCIAL DEL EQUIPO PARA VERIFICAR EL ESTADO FÍSICO Y FUNCIONAL DEL CIRCUITO ELECTRÓNICO, RESISTENCIA Y MECANISMO DE PALANCA Y GUILLOTINA.',

    'ANESTESIA DIGITAL': 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA. SE VERIFICA EL ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, DISPLAY, BOTONES E INDICADORES. SE REALIZA DESARME PARCIAL DE LA PIEZA DE MANO PARA VERIFICAR EL ESTADO FÍSICO Y FUNCIONAL DEL MECANISMO DE AVANCE Y RETROCESO.',

    'TERMOMETRO': 'SE REALIZALIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA Y SONDA, SE REALIZA DESARME PARCIAL PARA VERIFICAR ESTADO FISICO Y FUNCIONAL DEL CIRCUITO ELECTRÓNICO, DISPLAY, BOTONES Y SONDA.',

};

// Función para obtener el nombre del equipo seleccionado
function obtenerNombreEquipoSeleccionado() {
    const equipoSelect = document.getElementById('reporteEquipo');
    if (!equipoSelect || !equipoSelect.value) return '';
    
    const equipoId = equipoSelect.value;
    
    // Buscar en la BD el nombre del equipo
    return new Promise((resolve) => {
        db.collection('equipos').doc(equipoId).get()
            .then((doc) => {
                if (doc.exists) {
                    resolve(doc.data().nombre.toUpperCase());
                } else {
                    resolve('');
                }
            })
            .catch(() => resolve(''));
    });
}

// Función para obtener la leyenda de mantenimiento
async function obtenerLeyendaMantenimiento(tipoMto) {
    if (tipoMto !== 'PREVENTIVO') {
        return leyendasMantenimiento[tipoMto] || '';
    }
    
    // Si es PREVENTIVO, buscar leyenda específica del equipo
    const nombreEquipo = await obtenerNombreEquipoSeleccionado();
    
    // Buscar coincidencia exacta o parcial
    for (const [equipo, leyenda] of Object.entries(leyendasPreventivoEspecificas)) {
        if (nombreEquipo.includes(equipo)) {
            return leyenda;
        }
    }
    
    // Si no hay coincidencia específica, devolver la leyenda genérica
    return leyendasMantenimiento['PREVENTIVO'];
}

// Detectar cambio en los radio buttons de tipo de mantenimiento
document.addEventListener('change', async function(e) {
    if (e.target.name === 'tipoMto' && e.target.type === 'radio') {
        const tipoMto = e.target.value;
        const actividadField = document.getElementById('actividadMantenimiento');
        
        const leyenda = await obtenerLeyendaMantenimiento(tipoMto);
        if (leyenda) {
            actividadField.value = leyenda;
        }
    }
});

// Detectar cambio en el equipo seleccionado para actualizar leyenda si ya hay PREVENTIVO seleccionado
document.getElementById('reporteEquipo').addEventListener('change', async function() {
    // Verificar si ya está seleccionado PREVENTIVO
    const preventivoSeleccionado = document.querySelector('input[name="tipoMto"][value="PREVENTIVO"]:checked');
    
    if (preventivoSeleccionado) {
        const actividadField = document.getElementById('actividadMantenimiento');
        const leyenda = await obtenerLeyendaMantenimiento('PREVENTIVO');
        if (leyenda) {
            actividadField.value = leyenda;
        }
    }
});

// ============================================
// LLENAR OBSERVACIONES CON LEYENDA PREESTABLECIDA
// ============================================

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Llenar el campo de observaciones con la leyenda preestablecida
    const observacionesField = document.getElementById('observaciones');
    
    if (observacionesField) {
        observacionesField.value = 'EL EQUIPO FUNCIONA CORRECTAMENTE Y SE ENCUENTRA EN BUENA CONDICION FISICA. MANTENIMIENTO SEGUN PROTOCOLO BIOMEDICO.';
    }
});

// ============================================
// CONVERTIR ENTRADA A MAYÚSCULAS  
// ============================================
const inputsAMayusculas = document.querySelectorAll(
    '#clienteNombre, ' +
    '#clienteDireccion, ' +
    '#clienteTelefono, ' +
    '#clienteCorreo, ' +
    '#equipoNombre, ' +
    '#equipoMarca, ' +
    '#equipoModelo, ' +
    '#equipoSerie, ' +
    '#equipoUbicacion, ' +
    '#equipoAccesorios, ' +
    '#verificacionParametros, ' +
    '#fallaReportada, ' +
    '#actividadMantenimiento, ' +
    '#observaciones, ' +
    '#editClienteNombre, ' +
    '#editClienteDireccion, ' +
    '#editClienteTelefono, ' +
    '#editClienteCorreo, ' +
    '#editEquipoNombre, ' +
    '#editEquipoMarca, ' +
    '#editEquipoModelo, ' +
    '#editEquipoSerie, ' +
    '#editEquipoUbicacion, ' +
    '#editEquipoAccesorios'
);

inputsAMayusculas.forEach(input => {
    input.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});
