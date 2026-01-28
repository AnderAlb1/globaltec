// ============================================
// VARIABLES GLOBALES
// ============================================

let fotosSeleccionadas = [];
let usuarioActual = null;
let esAdmin = false;
let clientesCache = []; // Cache para búsqueda rápida
let equiposCache = []; // Cache para búsqueda rápida
let servicioActual = 'biomedico'; // Puede ser 'biomedico' o 'refrigeracion'



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
    mostrarServicio('biomedico');
    cargarTecnicosEnSelects();
    
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
    // Si es configuración, ocultar pestañas de servicios y mostrar pestañas de configuración
    if (seccion === 'configuracion') {
        document.getElementById('pestanasSuperiores').style.display = 'none';
        document.getElementById('pestanasConfiguracion').style.display = 'flex';
        document.querySelector('.contenido-principal').classList.remove('con-pestanas');
        document.querySelector('.contenido-principal').classList.add('con-pestanas-config');
        
        // Ocultar todas las secciones
        document.querySelectorAll('.seccion-contenido').forEach(s => s.classList.add('oculto'));
        
        // Mostrar solo configuración
        document.getElementById('seccion-configuracion').classList.remove('oculto');
        
        // Actualizar botón activo
        document.querySelectorAll('.btn-menu-lateral').forEach(btn => btn.classList.remove('activo'));
        document.querySelector('.btn-menu-lateral[onclick*="configuracion"]').classList.add('activo');
        
        // Mostrar la primera pestaña de configuración (logo)
        mostrarPestanaConfig('logo');
        
        // Cerrar menú en móvil
        if (window.innerWidth < 1025) {
            toggleMenuLateral();
        }
    }
}

// ============================================
// GESTIÓN DE SERVICIOS Y PESTAÑAS
// ============================================

window.mostrarServicio = function(servicio) {
    servicioActual = servicio;
    
    // Actualizar botones del menú lateral
    document.querySelectorAll('.btn-menu-lateral').forEach(btn => {
        btn.classList.remove('activo');
    });
    document.querySelector(`.btn-menu-lateral[data-servicio="${servicio}"]`).classList.add('activo');
    
    // Ocultar pestañas de configuración
    document.getElementById('pestanasConfiguracion').style.display = 'none';
    
    // Mostrar pestañas superiores de servicios
    document.getElementById('pestanasSuperiores').style.display = 'flex';
    
    // Actualizar clases del contenido principal
    document.querySelector('.contenido-principal').classList.remove('con-pestanas-config');
    document.querySelector('.contenido-principal').classList.add('con-pestanas');
    
    // Cargar datos específicos del servicio
    if (servicio === 'biomedico') {
        cargarClientes();
        cargarEquipos();
        cargarClientesEnSelects();
    } else if (servicio === 'refrigeracion') {
        cargarClientesRefrigeracion();
        cargarEquiposRefrigeracion();
        cargarClientesEnSelectsRefrigeracion();
    }
    
    // Mostrar la primera pestaña (clientes)
    mostrarPestana('clientes');
    
    // Cerrar menú en móvil
    if (window.innerWidth < 1025) {
        toggleMenuLateral();
    }
}

window.mostrarPestana = function(pestaña) {
    // Ocultar todas las secciones
    const todasLasSecciones = document.querySelectorAll('.seccion-contenido');
    todasLasSecciones.forEach(seccion => seccion.classList.add('oculto'));
    
    // Actualizar botones de pestañas
    document.querySelectorAll('.pestaña-btn').forEach(btn => {
        btn.classList.remove('activa');
    });
    document.querySelector(`.pestaña-btn[data-pestaña="${pestaña}"]`).classList.add('activa');
    
    // Mostrar la sección correspondiente según el servicio
    const sufijo = servicioActual === 'refrigeracion' ? '-refrigeracion' : '';
    const seccionId = `seccion-${pestaña}${sufijo}`;
    
    const seccion = document.getElementById(seccionId);
    if (seccion) {
        seccion.classList.remove('oculto');
    }
    
    localStorage.setItem('ultimaPestaña', pestaña);
}

// ============================================
// GESTIÓN DE PESTAÑAS DE CONFIGURACIÓN
// ============================================

window.mostrarPestanaConfig = function(pestaña) {
    // Ocultar todas las subsecciones de configuración
    document.querySelectorAll('.config-subseccion').forEach(subseccion => {
        subseccion.classList.add('oculto');
    });
    
    // Actualizar botones de pestañas de configuración
    document.querySelectorAll('.pestaña-config-btn').forEach(btn => {
        btn.classList.remove('activa');
    });
    document.querySelector(`.pestaña-config-btn[data-pestaña-config="${pestaña}"]`).classList.add('activa');
    
    // Mostrar la subsección correspondiente
    const subseccionId = `config-${pestaña}`;
    const subseccion = document.getElementById(subseccionId);
    if (subseccion) {
        subseccion.classList.remove('oculto');
    }
    
    // Cargar datos específicos
    if (pestaña === 'logo') {
        cargarConfiguracion();
    } else if (pestaña === 'tecnicos') {
        cargarTecnicos();
    } else if (pestaña === 'usuarios') {
        if (esAdmin) {
            cargarUsuarios();
        }
    }
    
    localStorage.setItem('ultimaPestanaConfig', pestaña);
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

    const cliente = {
        nombre: document.getElementById('clienteNombre').value,
        direccion: document.getElementById('clienteDireccion').value,
        telefono: document.getElementById('clienteTelefono').value,
        correo: document.getElementById('clienteCorreo').value,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: usuarioActual.email
    };

    db.collection('clientes').add(cliente)
        .then(() => {
            alert("Cliente agregado exitosamente");
            document.getElementById('formCliente').reset();
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
                <h3> ${cliente.nombre}</h3>
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
                <h3> ${equipo.nombre} - ${equipo.marca}</h3>
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

    // Construir objeto con datos actualizados
    const datosActualizados = {
        nombre,
        direccion,
        telefono,
        correo
    };

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
        
        // Obtener técnico seleccionado
        const tecnicoId = document.getElementById('reporteTecnico').value;
        if (!tecnicoId) {
            alert('Por favor seleccione un técnico');
            return;
        }

        // Obtener datos del técnico desde Firebase
        const tecnicoDoc = await db.collection('tecnicos').doc(tecnicoId).get();
        if (!tecnicoDoc.exists) {
            alert('Error: No se encontró el técnico seleccionado');
            return;
        }

        const tecnicoData = tecnicoDoc.data();

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
            accesoriosEstado,
            tecnicoData
        });
        
    } catch (error) {
        alert('Error al generar PDF: ' + error.message);
        console.error('Error:', error);
    }
}

async function construirPDF(doc, datos) {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Colores
    const colorAzulClaro = [216, 232, 247];
    const colorNegro = [0, 0, 0];
    const colorGrisOscuro = [50, 50, 50];
    
    // ======================
    // Logo y Firma en Base64 
    // ======================

    // DEFINIR VARIABLES FUERA DEL IF
    let logoBase64 = null;
    let firmaBase64 = null;

    const cfg = await db.collection('configuracion').doc('general').get();

    if (cfg.exists) {
        const c = cfg.data();
        if (c.logoBase64) {
            logoBase64 = c.logoBase64;  // GUARDAR EN VARIABLE
        }
        if (c.firmaBase64) {
            firmaBase64 = c.firmaBase64;  // GUARDAR EN VARIABLE
        }
    }


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
        if (logoBase64) {  // VERIFICAR QUE EXISTA
            doc.addImage(logoBase64, 'PNG', pageWidth - margin - 25, y - 9, 29, 20);
        }
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
    doc.text(datos.tecnicoData.nombre.toUpperCase(), margin + 3, y+2 + 11);
    doc.text(datos.tecnicoData.cargo.toUpperCase(), margin + 3, y+2 + 15);
    doc.text(`REG. INVIMA ${datos.tecnicoData.registroInvima}`, margin + 3, y+2 + 19);
    
    // Agregar firma del técnico
    try {
        if(datos.tecnicoData.firma) {  // Usar firma del técnico seleccionado
            doc.addImage(datos.tecnicoData.firma, 'PNG', margin + 50, y + 9, 30, 14);
        }
    } catch (e) {
        console.log('Error cargando firma del técnico');
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

    'TERMOFORMADOR' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE REALIZA DESARME PARCIAL PARA VERIFICAAR ESTADO FÍSICO Y FUNCIONAL DEL CIRCUITO ELECTRÓNICO, MECANICO, MECANISMO DE ASCENSO Y DESCENSO, BANDEJA DE TERMOFORMADO, RESISTENCIA Y MOTOR DE SUCCIÓN.',

    'TERMOHIGROMETRO' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, PANTALLA , BOTONES Y SONDA, SE REALIZA DESARME PARCIAL PARA VERIFICAR ESTADO DEL CIRCUITO ELECTRÓNICO Y DEL SENSOR DE TEMPERATURA Y HUMEDAD RELATIVA.',

    'MOTOR DE ENDODONCIA' : 'SE REALIZA LIMPIEZA EXTERNA E INTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA TANTO DE LA BASE COMO DE LA PIEZA DE MANO. SE REALIZA VERIFICACIÓN  DEL CONTRA ANGULO, INCLUYENDO LUBRICACIÓN DEL MECANISMO Y CARTUCHO',

    'SCALER ULTRASONICO' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, SE REALIZA DESARME PARCIAL PARA VERIFICAR ESTADO DEL CIRCUITO ELECTRÓNICO E HIDRÁULICO, SE VERIFICA ESTADO DEL CIRCUITO ELECTRÓNICO, PEDAL Y PIEZA DE MANO. SE REALIZA DESARME DE LA VÁLVULA SOLENOIDE PARA VERIFICACIÓN DE ESTADO Y LUBRICACIÓN',

    'SCALER ULTRASONIDO' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, SE REALIZA DESARME PARCIAL PARA VERIFICAR ESTADO DEL CIRCUITO ELECTRÓNICO E HIDRÁULICO, SE VERIFICA ESTADO DEL CIRCUITO ELECTRÓNICO, PEDAL Y PIEZA DE MANO. SE REALIZA DESARME DE LA VÁLVULA SOLENOIDE PARA VERIFICACIÓN DE ESTADO Y LUBRICACIÓN',

    'MICROMOTOR' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, BOTONES, PERILLA, PEDAL Y CABLES. SE REALIZA DESARME PARCIAL DEL PEDAL Y MICROMOTOR PARA VERIFICAR SU ESTADO',

    'MOTOR ELECTRICO' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO. SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, CIRCUITO ELECTRÓNICO, BOTONES, PERILLA, PEDAL Y CABLES. SE REALIZA DESARME PARCIAL DEL PEDAL Y MICROMOTOR PARA VERIFICAR SU ESTADO',

    'DESTILADOR' : 'SE REALIZA LIMPIEZA INTERNA Y EXTERNA DEL EQUIPO, SE VERIFICA ESTADO INTEGRAL DE LA CARCASA, TANQUES DE AGUA, CIRCUITO ELECTRÓNICO E HIDRÁULICO, RESISTENCIA Y VENTILADOR.  SE VERIFICA ESTADO DEL SWITCH DE INICIO, SE REALIZA LAVADO DEL DEPÓSITO Y FILTRO DE LA RESISTENCIA',

    

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
// CAMBIAR ESTO:
document.getElementById('formConfiguracion')
  ?.addEventListener('submit', async e => {
    e.preventDefault();

    const logoFile = document.getElementById('logoEmpresa').files[0];

    const toBase64 = file => new Promise(resolve => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

    const logo = await toBase64(logoFile);

    const data = {};
    if (logo) data.logoBase64 = logo;        
    data.actualizado = firebase.firestore.FieldValue.serverTimestamp();

    await db.collection('configuracion')
      .doc('general')
      .set(data, { merge: true });

    alert('Configuración guardada');
});

async function cargarConfiguracion() {
  const doc = await db.collection('configuracion')
    .doc('general').get();

  if (!doc.exists) return;
  const d = doc.data();

  if (d.logoBase64)  // ← CAMBIAR AQUÍ
    previewLogo.innerHTML = `<img src="${d.logoBase64}" style="max-width:200px">`;

}

// ============================================
// ALTERNAR ENTRE FORMULARIO MANUAL Y EXCEL
// ============================================

function mostrarFormularioManual() {
    document.getElementById('formularioManual').style.display = 'block';
    document.getElementById('formularioExcel').style.display = 'none';
    document.getElementById('btnManual').classList.add('activo');
    document.getElementById('btnExcel').classList.remove('activo');
}

function mostrarFormularioExcel() {
    document.getElementById('formularioManual').style.display = 'none';
    document.getElementById('formularioExcel').style.display = 'block';
    document.getElementById('btnManual').classList.remove('activo');
    document.getElementById('btnExcel').classList.add('activo');
}

// ============================================
// PROCESAR ARCHIVO EXCEL
// ============================================

// Detectar cuando se selecciona un archivo
document.addEventListener('DOMContentLoaded', function() {
    const inputExcel = document.getElementById('archivoExcel');
    if (inputExcel) {
        inputExcel.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                leerArchivoExcel(file);
            }
        });
    }
});

let equiposDesdeExcel = [];

async function leerArchivoExcel(file) {
    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
        const datos = XLSX.utils.sheet_to_json(primeraHoja, { header: 1 });
        
        // Omitir primera fila si parece ser encabezado
        const filas = datos[0] && typeof datos[0][0] === 'string' ? datos.slice(1) : datos;
        
        equiposDesdeExcel = [];
        
        filas.forEach((fila, index) => {
            // Saltar filas vacías
            if (!fila || !fila[0]) return;
            
            const equipo = {
                nombre: (fila[0] || '').toString().trim().toUpperCase(),
                marca: (fila[1] || '').toString().trim().toUpperCase(),
                modelo: (fila[2] || '').toString().trim().toUpperCase(),
                serie: (fila[3] || '').toString().trim().toUpperCase(),
                ubicacion: (fila[4] || '').toString().trim().toUpperCase(),
                accesorios: fila[5] ? fila[5].toString().split(',').map(a => a.trim().toUpperCase()) : []
            };
            
            // Solo agregar si tiene al menos nombre y marca
            if (equipo.nombre && equipo.marca) {
                equiposDesdeExcel.push(equipo);
            }
        });
        
        mostrarVistaPrevia();
        document.getElementById('btnProcesarExcel').disabled = equiposDesdeExcel.length === 0;
        
    } catch (error) {
        alert('Error al leer el archivo Excel: ' + error.message);
        console.error(error);
    }
}

function mostrarVistaPrevia() {
    const vistaPrevia = document.getElementById('vistaPrevia');
    const contenido = document.getElementById('contenidoVistaPrevia');
    
    if (equiposDesdeExcel.length === 0) {
        vistaPrevia.style.display = 'none';
        return;
    }
    
    vistaPrevia.style.display = 'block';
    
    let html = `<p><strong>Total de equipos encontrados: ${equiposDesdeExcel.length}</strong></p>`;
    
    equiposDesdeExcel.forEach((eq, i) => {
        html += `
            <div style="padding: 8px; margin: 5px 0; background: white; border-left: 3px solid #4CAF50; border-radius: 3px;">
                <strong>${i + 1}. ${eq.nombre}</strong> - ${eq.marca} ${eq.modelo}<br>
                <small>Serie: ${eq.serie} | Ubicación: ${eq.ubicacion || 'N/A'}</small>
                ${eq.accesorios.length > 0 ? `<br><small>Accesorios: ${eq.accesorios.join(', ')}</small>` : ''}
            </div>
        `;
    });
    
    contenido.innerHTML = html;
}

async function procesarExcel() {
    const clienteId = document.getElementById('equipoCliente').value;
    
    if (!clienteId) {
        alert('Por favor seleccione un cliente primero');
        return;
    }
    
    if (equiposDesdeExcel.length === 0) {
        alert('No hay equipos para procesar');
        return;
    }
    
    if (!confirm(`¿Desea agregar ${equiposDesdeExcel.length} equipos al cliente seleccionado?`)) {
        return;
    }
    
    const btnProcesar = document.getElementById('btnProcesarExcel');
    btnProcesar.disabled = true;
    btnProcesar.textContent = 'Procesando...';
    
    let exitosos = 0;
    let fallidos = 0;
    
    for (const equipo of equiposDesdeExcel) {
        try {
            await db.collection('equipos').add({
                clienteId: clienteId,
                nombre: equipo.nombre,
                marca: equipo.marca,
                modelo: equipo.modelo,
                serie: equipo.serie,
                ubicacion: equipo.ubicacion,
                accesorios: equipo.accesorios,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                creadoPor: usuarioActual.email
            });
            exitosos++;
        } catch (error) {
            console.error('Error al agregar equipo:', equipo.nombre, error);
            fallidos++;
        }
    }
    
    alert(`Proceso completado:\n✓ ${exitosos} equipos agregados exitosamente\n${fallidos > 0 ? `✗ ${fallidos} equipos fallaron` : ''}`);
    
    // Limpiar y recargar
    document.getElementById('archivoExcel').value = '';
    equiposDesdeExcel = [];
    document.getElementById('vistaPrevia').style.display = 'none';
    btnProcesar.disabled = true;
    btnProcesar.textContent = 'Agregar Equipos desde Excel';
    
    cargarEquipos();
}

// ============================================
// FUNCIONES PARA SERVICIO DE REFRIGERACIÓN
// ============================================

// Cargar clientes de refrigeración
function cargarClientesRefrigeracion() {
    db.collection('clientes-refrigeracion').orderBy('nombre').get()
        .then((querySnapshot) => {
            const lista = document.getElementById('listaClientesRefrigeracion');
            lista.innerHTML = '';
            
            if (querySnapshot.empty) {
                lista.innerHTML = '<p class="texto-info">No hay clientes registrados en refrigeración</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const cliente = doc.data();
                const div = document.createElement('div');
                div.className = 'item-lista';
                div.innerHTML = `
                    <div class="item-info">
                        <h3>${cliente.nombre}</h3>
                        <p></strong>Dirección:</strong> ${cliente.direccion}</p>
                        <p></strong>Télefono:</strong> ${cliente.telefono}</p>
                        <p></strong>Correo:</strong> ${cliente.correo || 'Sin correo'}</p>
                    </div>
                    <div class="item-acciones">
                        <button onclick="editarClienteRefrigeracion('${doc.id}')" class="btn-editar">Editar</button>
                        <button onclick="eliminarClienteRefrigeracion('${doc.id}')" class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                lista.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error al cargar clientes de refrigeración:', error);
        });
}

// Cargar equipos de refrigeración
function cargarEquiposRefrigeracion() {
    db.collection('equipos-refrigeracion').orderBy('nombre').get()
        .then((querySnapshot) => {
            const lista = document.getElementById('listaEquiposRefrigeracion');
            lista.innerHTML = '';
            
            if (querySnapshot.empty) {
                lista.innerHTML = '<p class="texto-info">No hay equipos registrados en refrigeración</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const equipo = doc.data();
                const div = document.createElement('div');
                div.className = 'item-lista';
                div.innerHTML = `
                    <div class="item-info">
                        <h3>${equipo.nombre}</h3>
                        <p>Cliente: ${equipo.clienteNombre}</p>
                        <p>Marca: ${equipo.marca} | Tipo: ${equipo.tipo || 'N/A'}</p>
                        <p>Modelo: ${equipo.modelo} | Serie: ${equipo.serie}</p>
                        <p>Capacidad: ${equipo.capacidad || 'N/A'} | Refrigerante: ${equipo.refrigerante || 'N/A'}</p>
                        <p>Ubicación: ${equipo.ubicacion}</p>
                    </div>
                    <div class="item-acciones">
                        <button onclick="editarEquipoRefrigeracion('${doc.id}')" class="btn-editar">Editar</button>
                        <button onclick="eliminarEquipoRefrigeracion('${doc.id}')" class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                lista.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error al cargar equipos de refrigeración:', error);
        });
}

// Cargar clientes en selects de refrigeración
function cargarClientesEnSelectsRefrigeracion() {
    db.collection('clientes-refrigeracion').orderBy('nombre').get()
        .then((querySnapshot) => {
            const selectEquipo = document.getElementById('equipoClienteRefrigeracion');
            const selectReporte = document.getElementById('reporteClienteRefrigeracion');
            
            selectEquipo.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
            selectReporte.innerHTML = '<option value="">-- Seleccione un cliente --</option>';
            
            querySnapshot.forEach((doc) => {
                const cliente = doc.data();
                const option1 = document.createElement('option');
                const option2 = document.createElement('option');
                
                option1.value = doc.id;
                option1.textContent = cliente.nombre;
                option2.value = doc.id;
                option2.textContent = cliente.nombre;
                
                selectEquipo.appendChild(option1);
                selectReporte.appendChild(option2);
            });
        });
}

// Funciones de búsqueda para refrigeración
function buscarClientesRefrigeracion(busqueda) {
    // Implementar búsqueda similar a la de biomédico
    console.log('Buscando clientes de refrigeración:', busqueda);
}

function buscarEquiposRefrigeracion(busqueda) {
    // Implementar búsqueda similar a la de biomédico
    console.log('Buscando equipos de refrigeración:', busqueda);
}

// Funciones de eliminación
window.eliminarClienteRefrigeracion = function(id) {
    if (!confirm('¿Está seguro de eliminar este cliente? También se eliminarán sus equipos.')) {
        return;
    }
    
    db.collection('equipos-refrigeracion').where('clienteId', '==', id).get()
        .then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            return db.collection('clientes-refrigeracion').doc(id).delete();
        })
        .then(() => {
            alert('Cliente eliminado');
            cargarClientesRefrigeracion();
            cargarEquiposRefrigeracion();
            cargarClientesEnSelectsRefrigeracion();
        })
        .catch((error) => {
            alert('Error al eliminar: ' + error.message);
        });
}

window.eliminarEquipoRefrigeracion = function(id) {
    if (!confirm('¿Está seguro de eliminar este equipo?')) {
        return;
    }
    
    db.collection('equipos-refrigeracion').doc(id).delete()
        .then(() => {
            alert('Equipo eliminado');
            cargarEquiposRefrigeracion();
        })
        .catch((error) => {
            alert('Error al eliminar: ' + error.message);
        });
}

// Event listeners para formularios de refrigeración
document.getElementById('formClienteRefrigeracion').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const cliente = {
        nombre: document.getElementById('clienteNombreRefrigeracion').value.toUpperCase(),
        direccion: document.getElementById('clienteDireccionRefrigeracion').value.toUpperCase(),
        telefono: document.getElementById('clienteTelefonoRefrigeracion').value.toUpperCase(),
        correo: document.getElementById('clienteCorreoRefrigeracion').value.toUpperCase(),
        fechaCreacion: new Date()
    };
    
    db.collection('clientes-refrigeracion').add(cliente)
        .then(() => {
            alert('Cliente agregado exitosamente');
            e.target.reset();
            cargarClientesRefrigeracion();
            cargarClientesEnSelectsRefrigeracion();
        })
        .catch((error) => {
            alert('Error al agregar cliente: ' + error.message);
        });
});

document.getElementById('formEquipoRefrigeracion').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const clienteId = document.getElementById('equipoClienteRefrigeracion').value;
    const clienteNombre = document.getElementById('equipoClienteRefrigeracion').selectedOptions[0].text;
    
    const equipo = {
        clienteId: clienteId,
        clienteNombre: clienteNombre,
        nombre: document.getElementById('equipoNombreRefrigeracion').value.toUpperCase(),
        marca: document.getElementById('equipoMarcaRefrigeracion').value.toUpperCase(),
        tipo: document.getElementById('equipoTipoRefrigeracion').value.toUpperCase(),
        modelo: document.getElementById('equipoModeloRefrigeracion').value.toUpperCase(),
        serie: document.getElementById('equipoSerieRefrigeracion').value.toUpperCase(),
        capacidad: document.getElementById('equipoCapacidadRefrigeracion').value.toUpperCase(),
        refrigerante: document.getElementById('equipoRefrigeranteRefrigeracion').value.toUpperCase(),
        ubicacion: document.getElementById('equipoUbicacionRefrigeracion').value.toUpperCase(),
        fechaCreacion: new Date()
    };
    
    db.collection('equipos-refrigeracion').add(equipo)
        .then(() => {
            alert('Equipo agregado exitosamente');
            e.target.reset();
            cargarEquiposRefrigeracion();
        })
        .catch((error) => {
            alert('Error al agregar equipo: ' + error.message);
        });
});

console.log('Funciones de refrigeración cargadas correctamente');
// ============================================
// GESTIÓN DE TÉCNICOS
// ============================================

// Cargar técnicos
function cargarTecnicos() {
    db.collection('tecnicos').orderBy('nombre').get()
        .then((querySnapshot) => {
            const lista = document.getElementById('listaTecnicos');
            lista.innerHTML = '';
            
            if (querySnapshot.empty) {
                lista.innerHTML = '<p class="texto-info">No hay técnicos registrados</p>';
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const tecnico = doc.data();
                const div = document.createElement('div');
                div.className = 'item-lista';
                div.innerHTML = `
                    <div class="item-info">
                        <h3>${tecnico.nombre}</h3>
                        <p>💼 Cargo: ${tecnico.cargo}</p>
                        <p>📋 Registro INVIMA: ${tecnico.registroInvima}</p>
                        ${tecnico.firma ? '<p>✍️ Firma registrada</p>' : '<p>⚠️ Sin firma</p>'}
                    </div>
                    <div class="item-acciones">
                        <button onclick="editarTecnico('${doc.id}')" class="btn-editar">Editar</button>
                        <button onclick="eliminarTecnico('${doc.id}')" class="btn-eliminar">Eliminar</button>
                    </div>
                `;
                lista.appendChild(div);
            });
        })
        .catch((error) => {
            console.error('Error al cargar técnicos:', error);
            alert('Error al cargar técnicos: ' + error.message);
        });
}

// Preview de firma de técnico
const inputFirmaTecnico = document.getElementById('tecnicoFirma');
if (inputFirmaTecnico) {
    inputFirmaTecnico.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('firmaPreviewTecnico');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Firma preview">`;
                preview.classList.remove('empty');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.add('empty');
        }
    });
}

// Agregar técnico
document.getElementById('formTecnico').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('tecnicoNombre').value.toUpperCase();
    const cargo = document.getElementById('tecnicoCargo').value.toUpperCase();
    const registroInvima = document.getElementById('tecnicoRegistroInvima').value.toUpperCase();
    const inputFirma = document.getElementById('tecnicoFirma');
    
    if (!inputFirma.files[0]) {
        alert('Por favor seleccione una firma');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const firmaBase64 = event.target.result;
        
        const tecnico = {
            nombre: nombre,
            cargo: cargo,
            registroInvima: registroInvima,
            firma: firmaBase64,
            fechaCreacion: new Date()
        };
        
        db.collection('tecnicos').add(tecnico)
            .then(() => {
                alert('Técnico agregado exitosamente');
                document.getElementById('formTecnico').reset();
                document.getElementById('firmaPreviewTecnico').innerHTML = '';
                cargarTecnicos();
                cargarTecnicosEnSelects(); // Actualizar los selects de reportes
            })
            .catch((error) => {
                alert('Error al agregar técnico: ' + error.message);
            });
    };
    
    reader.readAsDataURL(inputFirma.files[0]);
}); 

// Eliminar técnico
window.eliminarTecnico = function(id) {
    if (!confirm('¿Está seguro de eliminar este técnico?')) {
        return;
    }
    
    db.collection('tecnicos').doc(id).delete()
        .then(() => {
            alert('Técnico eliminado');
            cargarTecnicos();
        })
        .catch((error) => {
            alert('Error al eliminar técnico: ' + error.message);
        });
}

// Editar técnico (puedes implementar esto después)
// Editar técnico
window.editarTecnico = function(id) {
    db.collection('tecnicos').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const tecnico = doc.data();
                
                document.getElementById('editTecnicoId').value = id;
                document.getElementById('editTecnicoNombre').value = tecnico.nombre;
                document.getElementById('editTecnicoCargo').value = tecnico.cargo;
                document.getElementById('editTecnicoRegistroInvima').value = tecnico.registroInvima;
                
                // Mostrar firma actual si existe
                if (tecnico.firma) {
                    document.getElementById('editFirmaPreviewTecnico').innerHTML = 
                        `<img src="${tecnico.firma}" alt="Firma actual">`;
                } else {
                    document.getElementById('editFirmaPreviewTecnico').innerHTML = '';
                }
                
                document.getElementById('modalEditarTecnico').style.display = 'block';
            }
        })
        .catch((error) => {
            alert('Error al cargar técnico: ' + error.message);
        });
}

// Cerrar modal técnico
window.cerrarModalTecnico = function() {
    document.getElementById('modalEditarTecnico').style.display = 'none';
    document.getElementById('formEditarTecnico').reset();
    document.getElementById('editFirmaPreviewTecnico').innerHTML = '';
}

// Preview firma al editar técnico
const inputFirmaEditarTecnico = document.getElementById('editTecnicoFirma');
if (inputFirmaEditarTecnico) {
    inputFirmaEditarTecnico.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('editFirmaPreviewTecnico');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                preview.innerHTML = `<img src="${event.target.result}" alt="Firma preview">`;
                preview.classList.remove('empty');
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
            preview.classList.add('empty');
        }
    });
}

// Guardar cambios técnico
document.getElementById('formEditarTecnico').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editTecnicoId').value;
    const tecnicoActualizado = {
        nombre: document.getElementById('editTecnicoNombre').value.toUpperCase(),
        cargo: document.getElementById('editTecnicoCargo').value.toUpperCase(),
        registroInvima: document.getElementById('editTecnicoRegistroInvima').value.toUpperCase()
    };
    
    const inputFirma = document.getElementById('editTecnicoFirma');
    
    if (inputFirma.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            tecnicoActualizado.firma = event.target.result;
            
            db.collection('tecnicos').doc(id).update(tecnicoActualizado)
                .then(() => {
                    alert('Técnico actualizado exitosamente');
                    cerrarModalTecnico();
                    cargarTecnicos();
                    cargarTecnicosEnSelects();
                })
                .catch((error) => {
                    alert('Error al actualizar: ' + error.message);
                });
        };
        reader.readAsDataURL(inputFirma.files[0]);
    } else {
        db.collection('tecnicos').doc(id).update(tecnicoActualizado)
            .then(() => {
                alert('Técnico actualizado exitosamente');
                cerrarModalTecnico();
                cargarTecnicos();
                cargarTecnicosEnSelects();
            })
            .catch((error) => {
                alert('Error al actualizar: ' + error.message);
            });
    }
});


// Cargar técnicos en los selects de reportes
function cargarTecnicosEnSelects() {
    db.collection('tecnicos').orderBy('nombre').get()
        .then((querySnapshot) => {
            const selectBiomedico = document.getElementById('reporteTecnico');
            const selectRefrigeracion = document.getElementById('reporteTecnicoRefrigeracion');
            
            if (selectBiomedico) {
                selectBiomedico.innerHTML = '<option value="">-- Seleccione un técnico --</option>';
            }
            if (selectRefrigeracion) {
                selectRefrigeracion.innerHTML = '<option value="">-- Seleccione un técnico --</option>';
            }
            
            querySnapshot.forEach((doc) => {
                const tecnico = doc.data();
                
                if (selectBiomedico) {
                    const option1 = document.createElement('option');
                    option1.value = doc.id;
                    option1.textContent = `${tecnico.nombre} - ${tecnico.cargo}`;
                    selectBiomedico.appendChild(option1);
                }
                
                if (selectRefrigeracion) {
                    const option2 = document.createElement('option');
                    option2.value = doc.id;
                    option2.textContent = `${tecnico.nombre} - ${tecnico.cargo}`;
                    selectRefrigeracion.appendChild(option2);
                }
            });
        })
        .catch((error) => {
            console.error('Error al cargar técnicos en selects:', error);
        });
}

// ============================================
// CARGAR EQUIPOS DINÁMICAMENTE EN REPORTES
// ============================================
// Para REFRIGERACIÓN
window.cargarEquiposReporteRefrigeracion = function() {
    const clienteId = document.getElementById('reporteClienteRefrigeracion').value;
    const selectEquipo = document.getElementById('reporteEquipoRefrigeracion');
    
    if (!clienteId) {
        selectEquipo.disabled = true;
        selectEquipo.innerHTML = '<option value="">-- Primero seleccione un cliente --</option>';
        return;
    }
    
    selectEquipo.disabled = false;
    selectEquipo.innerHTML = '<option value="">-- Cargando equipos... --</option>';
    
    db.collection('equipos-refrigeracion')
        .where('clienteId', '==', clienteId)
        .get()
        .then((querySnapshot) => {
            selectEquipo.innerHTML = '<option value="">-- Seleccione un equipo --</option>';
            
            if (querySnapshot.empty) {
                selectEquipo.innerHTML = '<option value="">-- Este cliente no tiene equipos --</option>';
                return;
            }
            
                // Convertir a array y ordenar
            const equipos = [];
            querySnapshot.forEach((doc) => {
                equipos.push({
                    id: doc.id,
                    data: doc.data()
                });
            });
            
            // Ordenar alfabéticamente por nombre
            equipos.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre));
            
            // Agregar al select
            equipos.forEach((equipo) => {
                const option = document.createElement('option');
                option.value = equipo.id;
                option.textContent = `${equipo.data.nombre} - ${equipo.data.marca} ${equipo.data.modelo}`;
                selectEquipo.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error al cargar equipos:', error);
            selectEquipo.innerHTML = '<option value="">-- Error al cargar equipos --</option>';
        });
}

console.log('Funciones de carga dinámica de equipos en reportes cargadas correctamente');

// ============================================
// EDICIÓN DE CLIENTES Y EQUIPOS - REFRIGERACIÓN
// ============================================

// Editar cliente refrigeración
window.editarClienteRefrigeracion = function(id) {
    db.collection('clientes-refrigeracion').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const cliente = doc.data();
                
                document.getElementById('editClienteIdRefrigeracion').value = id;
                document.getElementById('editClienteNombreRefrigeracion').value = cliente.nombre;
                document.getElementById('editClienteDireccionRefrigeracion').value = cliente.direccion;
                document.getElementById('editClienteTelefonoRefrigeracion').value = cliente.telefono;
                document.getElementById('editClienteCorreoRefrigeracion').value = cliente.correo || '';            
                document.getElementById('modalEditarClienteRefrigeracion').style.display = 'block';
            }
        })
        .catch((error) => {
            alert('Error al cargar cliente: ' + error.message);
        });
}

// Cerrar modal cliente refrigeración
window.cerrarModalClienteRefrigeracion = function() {
    document.getElementById('modalEditarClienteRefrigeracion').style.display = 'none';
    document.getElementById('formEditarClienteRefrigeracion').reset();
}

// Editar equipo refrigeración
window.editarEquipoRefrigeracion = function(id) {
    db.collection('equipos-refrigeracion').doc(id).get()
        .then((doc) => {
            if (doc.exists) {
                const equipo = doc.data();
                
                document.getElementById('editEquipoIdRefrigeracion').value = id;
                document.getElementById('editEquipoNombreRefrigeracion').value = equipo.nombre;
                document.getElementById('editEquipoMarcaRefrigeracion').value = equipo.marca;
                document.getElementById('editEquipoTipoRefrigeracion').value = equipo.tipo || '';
                document.getElementById('editEquipoModeloRefrigeracion').value = equipo.modelo;
                document.getElementById('editEquipoSerieRefrigeracion').value = equipo.serie;
                document.getElementById('editEquipoCapacidadRefrigeracion').value = equipo.capacidad || '';
                document.getElementById('editEquipoRefrigeranteRefrigeracion').value = equipo.refrigerante || '';
                document.getElementById('editEquipoUbicacionRefrigeracion').value = equipo.ubicacion;
                // Cargar clientes en el select
                return db.collection('clientes-refrigeracion').orderBy('nombre').get()
                    .then((querySnapshot) => {
                        const select = document.getElementById('editEquipoClienteRefrigeracion');
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
                        
                        document.getElementById('modalEditarEquipoRefrigeracion').style.display = 'block';
                    });
            }
        })
        .catch((error) => {
            alert('Error al cargar equipo: ' + error.message);
        });
}

// Cerrar modal equipo refrigeración
window.cerrarModalEquipoRefrigeracion = function() {
    document.getElementById('modalEditarEquipoRefrigeracion').style.display = 'none';
    document.getElementById('formEditarEquipoRefrigeracion').reset();
}

// Guardar cambios cliente refrigeración
document.getElementById('formEditarClienteRefrigeracion').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editClienteIdRefrigeracion').value;
    const clienteActualizado = {
        nombre: document.getElementById('editClienteNombreRefrigeracion').value.toUpperCase(),
        direccion: document.getElementById('editClienteDireccionRefrigeracion').value.toUpperCase(),
        telefono: document.getElementById('editClienteTelefonoRefrigeracion').value,
        correo: document.getElementById('editClienteCorreoRefrigeracion').value
    };
    
    db.collection('clientes-refrigeracion').doc(id).update(clienteActualizado)
        .then(() => {
            alert('Cliente actualizado exitosamente');
            cerrarModalClienteRefrigeracion();
            cargarClientesRefrigeracion();
            cargarClientesEnSelectsRefrigeracion();
        })
        .catch((error) => {
            alert('Error al actualizar: ' + error.message);
        });
    
});

// Guardar cambios equipo refrigeración
document.getElementById('formEditarEquipoRefrigeracion').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const id = document.getElementById('editEquipoIdRefrigeracion').value;
    const equipoActualizado = {
        nombre: document.getElementById('editEquipoNombreRefrigeracion').value.toUpperCase(),
        marca: document.getElementById('editEquipoMarcaRefrigeracion').value.toUpperCase(),
        tipo: document.getElementById('editEquipoTipoRefrigeracion').value.toUpperCase(),
        modelo: document.getElementById('editEquipoModeloRefrigeracion').value.toUpperCase(),
        serie: document.getElementById('editEquipoSerieRefrigeracion').value.toUpperCase(),
        capacidad: document.getElementById('editEquipoCapacidadRefrigeracion').value.toUpperCase(),
        refrigerante: document.getElementById('editEquipoRefrigeranteRefrigeracion').value.toUpperCase(),
        ubicacion: document.getElementById('editEquipoUbicacionRefrigeracion').value.toUpperCase()
    };
    
    db.collection('equipos-refrigeracion').doc(id).update(equipoActualizado)
        .then(() => {
            alert('Equipo actualizado exitosamente');
            cerrarModalEquipoRefrigeracion();
            cargarEquiposRefrigeracion();
        })
        .catch((error) => {
            alert('Error al actualizar: ' + error.message);
        });
});

// ============================================
// GENERAR PDF REPORTE - REFRIGERACIÓN
// ============================================

document.getElementById('formReporteRefrigeracion').addEventListener('submit', async function(e) {
    e.preventDefault();
    await generarPDFRefrigeracion();
});

async function generarPDFRefrigeracion() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Obtener IDs
    const clienteId = document.getElementById('reporteClienteRefrigeracion').value;
    const equipoId = document.getElementById('reporteEquipoRefrigeracion').value;
    const tecnicoId = document.getElementById('reporteTecnicoRefrigeracion').value;
    
    if (!tecnicoId) {
        alert('Por favor seleccione un técnico');
        return;
    }
    
    try {
        // Obtener datos del cliente
        const clienteDoc = await db.collection('clientes-refrigeracion').doc(clienteId).get();
        const cliente = clienteDoc.data();
        
        // Obtener datos del equipo
        const equipoDoc = await db.collection('equipos-refrigeracion').doc(equipoId).get();
        const equipo = equipoDoc.data();
        
        // Obtener datos del técnico
        const tecnicoDoc = await db.collection('tecnicos').doc(tecnicoId).get();
        if (!tecnicoDoc.exists) {
            alert('Error: No se encontró el técnico seleccionado');
            return;
        }
        const tecnicoData = tecnicoDoc.data();
        
        // Obtener otros datos del formulario
        const fecha = document.getElementById('reporteFechaRefrigeracion').value;
        const servicioPor = document.querySelector('input[name="servicioPorRefrigeracion"]:checked').value;
        const tipoMto = document.querySelector('input[name="tipoMtoRefrigeracion"]:checked').value;
        const estadoEquipo = document.querySelector('input[name="estadoEquipoRefrigeracion"]:checked').value;
        const actividadMantenimiento = document.getElementById('actividadMantenimientoRefrigeracion').value;
        const observaciones = document.getElementById('observacionesRefrigeracion').value;
        
        // Construir PDF
        await construirPDFRefrigeracion(doc, {
            cliente,
            equipo,
            fecha,
            servicioPor,
            tipoMto,
            estadoEquipo,
            actividadMantenimiento,
            observaciones,
            tecnicoData
        });
        
    } catch (error) {
        alert('Error al generar PDF: ' + error.message);
        console.error('Error:', error);
    }
}

async function construirPDFRefrigeracion(doc, datos) {
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    
    // Colores
    const colorAzulClaro = [216, 232, 247];
    const colorVerdeClaro = [220, 247, 235]; // Color alternativo para refrigeración
    
    // Obtener logo de la empresa
    let logoBase64 = null;
    try {
        const cfg = await db.collection('configuracion').doc('empresa').get();
        if (cfg.exists) {
            const c = cfg.data();
            if (c.logo) {
                logoBase64 = c.logo;
            }
        }
    } catch (error) {
        console.log('No se pudo cargar el logo');
    }
    
    let y = margin;
    
    // ======================
    // ENCABEZADO
    // ======================
    
    // Logo de la empresa (lado izquierdo)
    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', margin, y, 40, 20);
        } catch (e) {
            console.log('Error al cargar logo de empresa');
        }
    }
    
    // Logo del cliente (lado derecho)
    if (datos.cliente.logoBase64) {
        try {
            doc.addImage(datos.cliente.logoBase64, 'PNG', pageWidth - margin - 40, y, 40, 20);
        } catch (e) {
            console.log('Error al cargar logo del cliente');
        }
    }
    
    y += 25;
    
    // Título principal
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('REPORTE DE SERVICIO - REFRIGERACIÓN', pageWidth / 2, y, { align: 'center' });
    
    y += 10;
    
    // ======================
    // INFORMACIÓN DEL CLIENTE
    // ======================
    
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 25, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`CLIENTE: ${datos.cliente.nombre}`, margin + 3, y + 10);
    doc.text(`DIRECCIÓN: ${datos.cliente.direccion}`, margin + 3, y + 14);
    doc.text(`TELÉFONO: ${datos.cliente.telefono}`, margin + 3, y + 18);
    doc.text(`FECHA: ${datos.fecha}`, margin + 3, y + 22);
    
    y += 28;
    
    // ======================
    // INFORMACIÓN DEL EQUIPO
    // ======================
    
    doc.setFillColor(colorVerdeClaro[0], colorVerdeClaro[1], colorVerdeClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 35, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('INFORMACIÓN DEL EQUIPO', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`EQUIPO: ${datos.equipo.nombre}`, margin + 3, y + 10);
    doc.text(`MARCA: ${datos.equipo.marca}`, margin + 3, y + 14);
    doc.text(`TIPO: ${datos.equipo.tipo || 'N/A'}`, margin + 3, y + 18);
    doc.text(`MODELO: ${datos.equipo.modelo}`, margin + 3, y + 22);
    
    doc.text(`SERIE: ${datos.equipo.serie}`, margin + 95, y + 10);
    doc.text(`CAPACIDAD: ${datos.equipo.capacidad || 'N/A'}`, margin + 95, y + 14);
    doc.text(`REFRIGERANTE: ${datos.equipo.refrigerante || 'N/A'}`, margin + 95, y + 18);
    doc.text(`UBICACIÓN: ${datos.equipo.ubicacion}`, margin + 95, y + 22);
    
    y += 38;
    
    // ======================
    // TIPO DE SERVICIO
    // ======================
    
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 15, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('TIPO DE SERVICIO', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`SERVICIO POR: ${datos.servicioPor}`, margin + 3, y + 10);
    doc.text(`TIPO DE MANTENIMIENTO: ${datos.tipoMto}`, margin + 60, y + 10);
    
    y += 18;
    
    // ======================
    // ESTADO DEL EQUIPO
    // ======================
    
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, 12, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('ESTADO DEL EQUIPO', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(`${datos.estadoEquipo}`, margin + 3, y + 9);
    
    y += 15;
    
    // ======================
    // ACTIVIDAD DE MANTENIMIENTO
    // ======================
    
    doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
    const actividadHeight = Math.max(30, Math.ceil(datos.actividadMantenimiento.length / 80) * 5 + 10);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, actividadHeight, 3, 3, 'F');
    doc.setDrawColor(150, 150, 150);
    doc.roundedRect(margin, y, pageWidth - 2 * margin, actividadHeight, 3, 3, 'S');
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('ACTIVIDAD DE MANTENIMIENTO', margin + 3, y + 5);
    
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const actividadLines = doc.splitTextToSize(datos.actividadMantenimiento, pageWidth - 2 * margin - 10);
    doc.text(actividadLines, margin + 3, y + 10);
    
    y += actividadHeight + 3;
    
    // ======================
    // OBSERVACIONES
    // ======================
    
    if (datos.observaciones) {
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        const observacionesHeight = Math.max(20, Math.ceil(datos.observaciones.length / 80) * 5 + 10);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, observacionesHeight, 3, 3, 'F');
        doc.setDrawColor(150, 150, 150);
        doc.roundedRect(margin, y, pageWidth - 2 * margin, observacionesHeight, 3, 3, 'S');
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('OBSERVACIONES', margin + 3, y + 5);
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const observacionesLines = doc.splitTextToSize(datos.observaciones, pageWidth - 2 * margin - 10);
        doc.text(observacionesLines, margin + 3, y + 10);
        
        y += observacionesHeight + 3;
    }
    
    // ======================
    // FIRMAS
    // ======================
    
    // Verificar si hay espacio suficiente
    if (y > pageHeight - 50) {
        doc.addPage();
        y = margin;
    }
    
    const firmaHeight = 30;
    const col1Width = 90;
    const col2Width = 90;
    const col1X = margin;
    const col2X = margin + col1Width + 5;
    
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
    doc.text(datos.tecnicoData.nombre, margin + 3, y + 11);
    doc.text(datos.tecnicoData.cargo, margin + 3, y + 15);
    doc.text(`REG INVIMA ${datos.tecnicoData.registroInvima}`, margin + 3, y + 19);
    
    // Agregar firma del técnico
    if (datos.tecnicoData.firma) {
        try {
            doc.addImage(datos.tecnicoData.firma, 'PNG', margin + 50, y + 9, 30, 14);
        } catch (e) {
            console.log('Error cargando firma del técnico');
        }
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
    
    // ======================
    // EVIDENCIA FOTOGRÁFICA (si hay)
    // ======================
    
    const fotosInput = document.getElementById('fotosRefrigeracion');
    if (fotosInput && fotosInput.files.length > 0) {
        doc.addPage();
        let yFoto = margin + 10;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('EVIDENCIA FOTOGRÁFICA', pageWidth / 2, yFoto, { align: 'center' });
        
        yFoto += 10;
        
        let xFoto = margin;
        let fotosPorFila = 0;
        
        for (let i = 0; i < fotosInput.files.length; i++) {
            const file = fotosInput.files[i];
            const reader = new FileReader();
            
            await new Promise((resolve) => {
                reader.onload = function(e) {
                    const imgData = e.target.result;
                    
                    if (yFoto > pageHeight - 100) {
                        doc.addPage();
                        yFoto = margin + 10;
                        xFoto = margin;
                        fotosPorFila = 0;
                    }
                    
                    try {
                        doc.addImage(imgData, 'JPEG', xFoto, yFoto, 85, 75);
                    } catch (err) {
                        console.log('Error al agregar imagen');
                    }
                    
                    fotosPorFila++;
                    
                    if (fotosPorFila === 2) {
                        yFoto += 80;
                        xFoto = margin;
                        fotosPorFila = 0;
                    } else {
                        xFoto += 90;
                    }
                    
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
    }
    
    // Guardar PDF
    const nombreArchivo = `Reporte_Refrigeracion_${datos.cliente.nombre}_${datos.fecha}.pdf`;
    doc.save(nombreArchivo);
}

console.log('Funciones de generación de PDF para refrigeración cargadas correctamente');
