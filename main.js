// ==========================================
// INICIALIZACIÓN DEL CANVAS Y VERIFICACIÓN
// ==========================================
const canvas = document.getElementById('c');
if (typeof THREE === 'undefined') {
    document.body.innerHTML = '<p style="color:white;text-align:center;padding:2rem;font-family:Georgia,serif;">Error: no se pudo cargar three.js. Revisa tu conexión a internet.</p>';
    throw new Error('THREE no cargado');
}

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });

// ==========================================
// DETECCIÓN DE GPU Y CALIDAD ADAPTATIVA
// ==========================================
let nombreGPU = 'desconocida';
(function () {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) nombreGPU = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    console.log('GPU en uso:', nombreGPU);
})();

const SIN_GPU = /basic render|swiftshader|llvmpipe|software/i.test(nombreGPU);

if (SIN_GPU) {
    const aviso = document.createElement('div');
    aviso.style.cssText = 'position:fixed;bottom:10px;left:50%;transform:translateX(-50%);z-index:200;' +
        'background:rgba(0,0,0,0.85);color:#e8d9a8;border:1px solid #c9a227;border-radius:6px;' +
        'padding:10px 16px;font:13px Georgia,serif;max-width:560px;text-align:center;';
    aviso.innerHTML = 'Tu navegador no está usando la tarjeta gráfica, por eso puede ir lento. ' +
        'Activa la aceleración por hardware en la configuración del navegador.' +
        ' <button style="margin-left:8px;padding:2px 8px;cursor:pointer" onclick="this.parentNode.remove()">OK</button>';
    document.body.appendChild(aviso);
}

const ESCALA_MAX = SIN_GPU ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);
const ESCALA_MIN = 0.4;
let escala = ESCALA_MAX;
let acumTiempo = 0, acumFrames = 0, intervalosOmitidos = 2;

function aplicarEscala() {
    renderer.setPixelRatio(escala);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function monitorear(delta) {
    if (delta > 0.5) { acumTiempo = 0; acumFrames = 0; return; }
    acumTiempo += delta; acumFrames++;
    if (acumTiempo < 2) return;
    const fps = acumFrames / acumTiempo;
    acumTiempo = 0; acumFrames = 0;
    if (intervalosOmitidos > 0) { intervalosOmitidos--; return; }
    if (fps < 40 && escala > ESCALA_MIN) {
        escala = Math.max(ESCALA_MIN, escala * 0.85);
        aplicarEscala();
    } else if (fps > 58 && escala < ESCALA_MAX) {
        escala = Math.min(ESCALA_MAX, escala * 1.05);
        aplicarEscala();
    }
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(escala);
renderer.shadowMap.enabled = !SIN_GPU;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;

// ==========================================
// ESCENA Y CÁMARA
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 40, 100);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.rotation.order = 'YXZ';

// ==========================================
// ILUMINACIÓN GLOBAL
// ==========================================
scene.add(new THREE.AmbientLight(0xffffff, 0.8)); 
scene.add(new THREE.HemisphereLight(0xffeedd, 0x111111, 0.7));
const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = !SIN_GPU;
if (dirLight.shadow) {
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
}
scene.add(dirLight);

const colisiones = window.crearMuseo(scene);

// ==========================================
// DATOS DE LAS PIEZAS
// ==========================================
const PIEZAS_DATA = [
    // --- SALA 1: EL TESORO QUIMBAYA (Centro: -32, 0, 26) ---
    {
        id: 1, nombre: "Poporo Quimbaya", cultura: "Quimbaya, siglos I–VI d. C.", museo: "The Metropolitan Museum of Art (MET)", pais: "Estados Unidos",
        descripcion: "El poporo guardaba cal en polvo que se mezclaba con hojas de coca en un uso ritual andino. Esta botella con hombros lleva una figura femenina a cada lado y, según el Met, aún conserva cal en su interior. N.º 1991.419.22.",
        modelo: "poporo_dorado", pos: new THREE.Vector3(-38, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 2, nombre: "Alfiler Quimbaya", cultura: "Quimbaya, siglos IV-V d. C.", museo: "Museo de América, Madrid", pais: "España",
        descripcion: "Alfiler de tumbaga hecho con fundición a la cera perdida, pulido y soldadura. N.º 17448.",
        modelo: "pin_quimbaya_color", pos: new THREE.Vector3(-38, 0, 22), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 14, nombre: "Pin Quimbaya Gallo", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América (Madrid, España)", pais: "España",
        descripcion: "Alfiler gallo Quimbaya. Alfiler de tumbaga hecho con fundición a la cera perdida, pulido y soldadura.",
        modelo: "pin_quimbaya_culture_gallo", pos: new THREE.Vector3(-38, 0, 30), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 8, nombre: "Ear Ornament Quimbaya", cultura: "Quimbaya siglos IV–V d. C", museo: " La Soledad (Filandia, Colombia)", pais: "Finlandia",
        descripcion: "Ornamento de oreja Quimbaya. Adorno para la oreja en tumbaga, modelado a la cera perdida, pulido y trabajado con filigrana simulada.",
        modelo: "ear_ornament_quimbaya_culture", pos: new THREE.Vector3(-38, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 9, nombre: "Gold Incense Burner", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América (Madrid, España)", pais: "España",
        descripcion: "Incensario de oro Quimbaya. Incensario de oro con rostro, hecho con cera perdida, pulido y soldadura..",
        modelo: "gold_incense_burner_quimbaya_culture", pos: new THREE.Vector3(-35, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 10, nombre: "Helmet Quimbaya", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América (Madrid, España)", pais: "España",
        descripcion: "Casco Quimbaya. Casco de oro hecho con cera perdida, pulido, laminado y repujado.",
        modelo: "helmet_quimbaya_culture", pos: new THREE.Vector3(-32, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 11, nombre: "Necklace Piece Quimbaya", cultura: "Quimbaya siglos IV–V d. C", museo: "Museo de América (Madrid, España", pais: "España",
        descripcion: "Pieza de collar Quimbaya. Pieza de collar en tumbaga, procedente del sitio arqueológico de La Soledad (Filandia).",
        modelo: "necklace_piece_quimbaya_culture", pos: new THREE.Vector3(-29, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 7, nombre: "Collar separador Quimbaya", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América, Madrid", pais: "España",
        descripcion: "Collar separador formado por 11 cuentas tubulares unidas en una barra. Ficha por completar: fecha, técnica y n.º de objeto.",
        modelo: "collar_separador_quimbaya", pos: new THREE.Vector3(-35, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 13, nombre: "Pendant Quimbaya Tres", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América (Madrid, España)", pais: "España",
        descripcion: "Colgante Quimbaya 3. Colgante de tumbaga hecho con cera perdida y pulido.",
        modelo: "pendant_quimbaya_culture_tres", pos: new THREE.Vector3(-32, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 12, nombre: "Pendant Quimbaya", cultura: "Quimbaya siglos IV–V d. C.", museo: "Museo de América (Madrid, España)", pais: "España",
        descripcion: "Colgante Quimbaya. Colgante de tumbaga procedente del sitio arqueológico de La Soledad (Filandia).",
        modelo: "pendant_quimbaya_culture", pos: new THREE.Vector3(-29, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },

    // --- SALA 2: TUNJOS (Centro: -32, 0, 0) ---
    {
        id: 15, nombre: "Tunjo Femenino", cultura: "Muisca siglos X–XVI ·", museo: "Museo Británico (Londres, Reino Unido)", pais: "Reino Unido",
        descripcion: "Figura femenina en oro. Representa a una mujer con un collar de cuatro colgantes circulares y un cinturón trenzado; de su hombro izquierdo cuelga una pelota atada a una cuerda. Le falta la cabeza.",
        modelo: "01_tunjo_femenino", pos: new THREE.Vector3(-38, 0, -9), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    { 
        id: 16, nombre: "Colgante con Pájaro", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante con figura de ave. colgante con un pájaro y discos colgantes.",
        modelo: "colgante_con_pajaro", pos: new THREE.Vector3(-38, 0, -3), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 17, nombre: "Colgante Pájaro", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante de ave. Muchas piezas muiscas son ofrendas votivas hechas con cera perdida en tumbaga y a menudo se dejaban sin pulir, como este colgante.",
        modelo: "colgante_pajaro", pos: new THREE.Vector3(-38, 0, 3), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 18, nombre: "Figura Femenina Tunjo", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "FIgura Femenina Tunjo. pequeño tunjo femenino en oro, de unos cuatro centímetros de altura.",
        modelo: "figura_femenina_tunjo", pos: new THREE.Vector3(-34, 0, -10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 19, nombre: "Figura Masculina sobre un taburete (Tunjo)", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Tunjo masculino sentado en taburete. Pequeño tunjo que muestra a una figura masculina sentada sobre un taburete de cuatro patas..",
        modelo: "figura_masculina_taburete", pos: new THREE.Vector3(-34, 0, -10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 20, nombre: "Figura Masculina Tunjo", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Tunjo masculino. Tunjo masculino en oro, de la región del lago Guatavita, un lugar sagrado para los muisca.",
        modelo: "figura_masculina_tunjo", pos: new THREE.Vector3(-32, 0, -10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 21, nombre: "Figura Masculina Tunjo (1991)", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Tunjo masculino variante 1991. Tunjo masculino muy esbelto, de apenas 6,4 cm de alto.",
        modelo: "figura_masculina_tunjo_1991", pos: new THREE.Vector3(-30, 0, -10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 22, nombre: "Figura Masculina Tunjo (2000)", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Tunjo masculino variante 2000. Tunjo masculino de casi quince centímetros, con tocado rectangular.",
        modelo: "figura_masculina_tunjo_2000", pos: new THREE.Vector3(-34, 0, 10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 23, nombre: "Sección de Diadema", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Fragmento de diadema en oro. Fragmento de diadema con calados en forma de red y discos colgantes.",
        modelo: "seccion_de_diadema", pos: new THREE.Vector3(-32, 0, 10), centroSala: new THREE.Vector3(-32, 0, 0)
    },
    {
        id: 24, nombre: "Serpiente Tunjo", cultura: "Muisca siglos X–XVI ·", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Figura de serpiente en oro. Tunjo en forma de serpiente, una figura delgada y trenzada de unos once centímetros.",
        modelo: "serpiente_tunjo", pos: new THREE.Vector3(-30, 0, 10), centroSala: new THREE.Vector3(-32, 0, 0)
    },

    // --- SALA 3: TAIRONA (Centro: -32, 0, -26) ---
    {
        id: 25, nombre: "Pectoral de Ave", cultura: "Tairona, siglos X–XVI, Colombia. Aleación de oro.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Las alas y la cola extendidas son comunes en Costa Rica y Panamá, pero aquí la pieza es más ornamentada, con trenzas, espirales y bolitas de oro típicas de la orfebrería tairona. Las garras sostienen una serpiente estilizada de dos cabezas. N.º 1974.271.12.",
        modelo: "ave_tairone", pos: new THREE.Vector3(-38, 0, -18), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 26, nombre: "Campana de Oro", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Campana de oro. Pequeña campana que el Met clasifica como instrumento musical; mide poco más de un centímetro.",
        modelo: "campana_de_oro", pos: new THREE.Vector3(-38, 0, -22), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 27, nombre: "Colgante con Figura 31", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante con figura. Colgante tairona con figura, fundido en una aleación de oro y de unos ocho centímetros de alto. Pendiente: el archivo fuente no trae descripción de esta pieza; se deja solo lo que dice la ficha.",
        modelo: "colgante_con_figura_31", pos: new THREE.Vector3(-38, 0, -26), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 28, nombre: "Colgante con Figura", cultura: "Tairona, 900–1600 d. C.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante con figura. Figura masculina de hombros anchos, de pie con las manos en las caderas. Tiene hocico dentado de cocodrilo y hoja nasal de murciélago, y un tocado monumental con dos aves de pico grande y adornos laterales en espiral y trenzados. Podría representar a un ser sobrenatural, un gobernante o un especialista ritual en transformación simbólica y espiritual.",
        modelo: "colgante_con_figura", pos: new THREE.Vector3(-38, 0, -30), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 29, nombre: "Colgante de Campana", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante de campana.  Colgante en forma de campana con rostro y orejeras de espirales.",
        modelo: "colgante_de_campana", pos: new THREE.Vector3(-38, 0, -34), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 30, nombre: "Colgante en Forma de Figura", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante en forma de figura. Representa a una figura masculina de anchas espaldas, tal vez un noble o jefe, con un enorme penacho de trenzas y espirales y dos pájaros de pico largo sobre el tocado. Nariguera, orejeras y bezote son miniaturas de gran precisión, comparables a las piezas de tamaño natural halladas en tumbas taironas.",
        modelo: "colgante_en_forma_de_figura", pos: new THREE.Vector3(-34, 0, -34), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 31, nombre: "Collar", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Collar de oro. Collar de oro formado por elementos alargados que se cierran en círculo, de unos 23 cm de diámetro.",
        modelo: "collar", pos: new THREE.Vector3(-30, 0, -34), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 32, nombre: "Labret 2005", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Labret de oro. Otro labret tairona, de forma de sombrero con ala.",
        modelo: "labret_2005", pos: new THREE.Vector3(-26, 0, -34), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 33, nombre: "Remate de Hueso", cultura: "Tairona, siglos 1000–1600", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Remate de hueso. Remate tallado en hueso; no todo lo que salió de Colombia es oro. Decisión pendiente: dejarlo o sacarlo, porque la sala trata de orfebrería.",
        modelo: "remate_de_hueso", pos: new THREE.Vector3(-30, 0, -18), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 34, nombre: "Labret 1974", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Labret de oro. Labret, adorno que se llevaba en el labio inferior.",
        modelo: "s3-05_labret_1974", pos: new THREE.Vector3(-34, 0, -18), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 35, nombre: "Tapa de Labret", cultura: "Tairona, siglos X–XVI", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Tapa de labret. Tapa de labret decorada con espirales de hilo de oro.",
        modelo: "tapa_de_labret", pos: new THREE.Vector3(-26, 0, -18), centroSala: new THREE.Vector3(-32, 0, -26)
    },

    // --- SALA 4: EL RESTO DE COLOMBIA (Centro: -16, 0, -32) ---
    {
        id: 6, nombre: "Ornamento nasal", cultura: "Colombia (origen atribuido con reservas), siglos X–XVI. Oro martillado.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Ornamento nasal. Ornamento nasal de lámina de oro martillada, con una pieza central en forma de media luna y dos volutas laterales. El museo lo atribuye con reservas a Colombia y su cultura de origen no está confirmada.",
        modelo: "nariguera_dorada", pos: new THREE.Vector3(-16, 0, -38), centroSala: new THREE.Vector3(-16, 0, -32)
    }
];

const botones = [];
const totalPiezas = PIEZAS_DATA.length;

console.log(`[Sistema] Total de piezas a renderizar en el museo: ${totalPiezas}`); 

let piezasCargadas = 0;

const divCargando = document.getElementById('cargando');
function actualizarCarga() {
    if (!divCargando) return;
    if (piezasCargadas >= totalPiezas) {
        divCargando.style.display = 'none';
        if (!SIN_GPU) renderer.shadowMap.needsUpdate = true;
    } else {
        divCargando.style.display = 'block';
        divCargando.textContent = `Cargando piezas... ${piezasCargadas}/${totalPiezas}`;
    }
}
actualizarCarga();

PIEZAS_DATA.forEach((datos) => {
    const p = new window.Pieza(datos, scene, datos.centroSala, colisiones, () => {
        piezasCargadas++;
        actualizarCarga();
    });
    botones.push(p.boton);
});

window.inicializarUI();
const jugador = new window.Jugador(camera, scene, colisiones, botones);

// ==========================================
// <--- NUEVO 1: INSTANCIAR EL GESTOR DE SONIDO
// ==========================================
const gestorSonido = new window.GestorSonido();

try { renderer.compile(scene, camera); } catch (e) {}

// ==========================================
// LÓGICA DE PAUSA Y POINTER LOCK
// ==========================================
let pausado = false;
let pointerEstuvoBloqueado = false;
let estabaMostrandoInfo = false;

function panelInfoVisible() {
    const pi = document.getElementById('panelInfo');
    return !!(pi && pi.style.display && pi.style.display !== 'none');
}

function bloquearPuntero() {
    try {
        const p = document.body.requestPointerLock();
        if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
}

function abrirPausa() {
    if (pausado) return;
    jugador.enJuego = false;
    pausado = true;
    
    // <--- NUEVO 2: PAUSAR MÚSICA
    if (gestorSonido) gestorSonido.pausar();

    const pi = document.getElementById('panelInfo');
    if (pi) pi.style.display = 'none';
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('pausa').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('cross').style.display = 'none';
}

function cerrarPausa() {
    if (!pausado) return;
    pausado = false;
    document.getElementById('pausa').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('cross').style.display = 'block';
    jugador.enJuego = true;

    // <--- NUEVO 3: REANUDAR MÚSICA
    if (gestorSonido) gestorSonido.reanudar();

    bloquearPuntero();
}

function salirAlIntro() {
    pausado = false;
    jugador.enJuego = false;
    if (document.pointerLockElement) document.exitPointerLock();
    
    // <--- NUEVO 4: PAUSAR MÚSICA AL SALIR
    if (gestorSonido) gestorSonido.pausar();

    document.getElementById('pausa').style.display = 'none';
    document.getElementById('intro').style.display = 'flex';
    document.getElementById('salir').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('cross').style.display = 'none';
}

document.getElementById('btnEntrar').addEventListener('click', () => {
    document.getElementById('intro').style.display = 'none';
    document.getElementById('salir').style.display = 'block';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('cross').style.display = 'block';
    jugador.pos.set(0, window.OJO_Y, 35);
    jugador.yaw = 0; jugador.pitch = 0;
    jugador.enJuego = true;

    // <--- NUEVO 5: INICIAR MÚSICA (aprovechando el clic del usuario)
    if (gestorSonido) gestorSonido.iniciar();

    bloquearPuntero();
});

document.getElementById('salir').addEventListener('click', salirAlIntro);
document.getElementById('pausaContinuar').addEventListener('click', cerrarPausa);
document.getElementById('pausaCerrar').addEventListener('click', cerrarPausa);
document.getElementById('pausaSalir').addEventListener('click', salirAlIntro);

window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyP') return;
    const intro = document.getElementById('intro');
    const enMuseo = intro && getComputedStyle(intro).display === 'none';
    if (!enMuseo) return;
    if (pausado) cerrarPausa();
    else abrirPausa();
});

document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === document.body;
    if (locked) { pointerEstuvoBloqueado = true; return; }
    if (!pointerEstuvoBloqueado) return;
    pointerEstuvoBloqueado = false;
    if (pausado || !jugador.enJuego) return;
    setTimeout(() => {
        if (document.pointerLockElement === document.body) return;
        if (pausado || !jugador.enJuego) return;
        if (!panelInfoVisible()) abrirPausa();
    }, 150);
});

document.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (pausado) return;
    if (jugador.enJuego && !document.pointerLockElement) bloquearPuntero();
});

// ==========================================
// BUCLE DE ANIMACIÓN
// ==========================================
const reloj = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);
    const delta = reloj.getDelta();
    const dt = Math.min(delta, 0.1); 
    monitorear(delta);

    const piVisible = panelInfoVisible();
    if (estabaMostrandoInfo && !piVisible && !pausado && !jugador.enJuego) {
        const intro = document.getElementById('intro');
        const enMuseo = intro && getComputedStyle(intro).display === 'none';
        if (enMuseo) {
            jugador.enJuego = true;
            bloquearPuntero();
        }
    }
    estabaMostrandoInfo = piVisible;

    if (window.objetosFlotantes && window.objetosFlotantes.length) {
        const time = reloj.getElapsedTime();
        const lista = window.objetosFlotantes;
        for (let i = 0; i < lista.length; i++) {
            const obj = lista[i];
            obj.mesh.rotation.y = time * obj.speedY;
            obj.mesh.rotation.x = time * obj.speedX;
            obj.mesh.position.y = obj.baseY + Math.sin(time * obj.floatSpeed + obj.offset) * 0.15;
        }
    }

    jugador.actualizar(dt);

    // <--- NUEVO 6: ACTUALIZAR EL SENSOR DE SONIDO CON LA POSICIÓN DEL JUGADOR
    if (gestorSonido) {
        gestorSonido.actualizar(jugador.pos.x, jugador.pos.z, dt);
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animar();