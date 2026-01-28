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
