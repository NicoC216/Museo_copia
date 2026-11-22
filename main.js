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
renderer.shadowMap.autoUpdate = false; // OPTIMIZACIÓN: No recalcular sombras cada frame

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
    // Exactamente 10 piezas.
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
    // NOTA: El ID 3 (pin_quimbaya_culture) fue eliminado de aquí. 
    // Ahora solo hay 10 vitrinas en esta sala.
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
        descripcion: "Tunjo masculino sentado en taburete. Pequeño tunjo que muestra a una figura masculina sentada sobre un taburete de cuatro patas.",
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

    // --- SALA 3: LOS TAIRONA (Centro: -32, 0, -26) ---
    {
        id: 4, nombre: "Colgante de ave con serpiente", cultura: "Tairona, siglos X–XVI, Colombia. Aleación de oro.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante de ave con serpiente. Ave de alas y cola extendidas, un rasgo común en Costa Rica y Panamá, aquí con las trenzas, espirales y bolitas de oro típicas de la orfebrería tairona. Sus garras sostienen una serpienteLas alas y la cola extendidas son comunes en Costa Rica y Panamá, pero aquí la pieza es más ornamentada, con trenzas, espirales y bolitas de oro típicas de la orfebrería tairona. Las garras sostienen una serpiente estilizada de dos cabezas. N.º 1974.271.12.",
        modelo: "ave_tairona", pos: new THREE.Vector3(-38, 0, -20), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 5, nombre: "Pectoral Dorado", cultura: "Tairona, siglos X–XVI, Colombia.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Pectoral de oro tairona, pieza de orfebrería de alta complejidad.",
        modelo: "pectoral_dorado", pos: new THREE.Vector3(-38, 0, -32), centroSala: new THREE.Vector3(-32, 0, -26)
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

// LOG DE CONTROL: Esto imprimirá en la consola cuántas piezas se van a renderizar en total.
// Sala 1 (10) + Sala 2 (10) + Sala 3 (2) + Sala 4 (1) = 23 piezas en total.
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
    bloquearPuntero();
}

function salirAlIntro() {
    pausado = false;
    jugador.enJuego = false;
    if (document.pointerLockElement) document.exitPointerLock();
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
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animar();