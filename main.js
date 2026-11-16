const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });

// Detecta qué GPU usa el navegador
let nombreGPU = 'desconocida';
(function () {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) nombreGPU = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    console.log('GPU en uso:', nombreGPU);
})();
const SIN_GPU = /basic render|swiftshader|llvmpipe|software/i.test(nombreGPU);

// Si el navegador renderiza por software, avisa al visitante
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

// Calidad adaptativa
const ESCALA_MAX = Math.min(window.devicePixelRatio, 2);
const ESCALA_MIN = 0.5;
let escala = SIN_GPU ? 0.75 : ESCALA_MAX;
let acumTiempo = 0, acumFrames = 0, intervalosOmitidos = 1;

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
        escala = Math.max(ESCALA_MIN, escala * 0.8);
        aplicarEscala();
        console.log('Calidad ajustada: escala', escala.toFixed(2), 'fps', fps.toFixed(0));
    }
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(escala);
renderer.shadowMap.enabled = !SIN_GPU; // Desactiva sombras si no hay GPU
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false; // OPTIMIZACIÓN: Las sombras no se recalculan cada frame

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);
scene.fog = new THREE.Fog(0x0a0a0a, 40, 120);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.rotation.order = 'YXZ';

scene.add(new THREE.AmbientLight(0xffffff, 0.4)); 
const hemi = new THREE.HemisphereLight(0xffffff, 0x111111, 0.5);
scene.add(hemi);
const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = !SIN_GPU;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

const colisiones = window.crearMuseo(scene);

const PIEZAS_DATA = [
    // --- SALA 1: EL TESORO QUIMBAYA (Centro: -32, 0, 26) ---
    // Redistribuidas para no bloquear la puerta de entrada (x: -24, z: 26)
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
        id: 3, nombre: "Broche / Alfiler Quimbaya", cultura: "Quimbaya, siglos IV-V d. C.", museo: "Museo de América, Madrid", pais: "España",
        descripcion: "Broche de tumbaga hecho con cera perdida, pulido y soldadura. N.º 17461.",
        modelo: "pin_quimbaya_culture", pos: new THREE.Vector3(-38, 0, 30), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 14, nombre: "Pin Quimbaya Gallo", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Alfiler gallo Quimbaya. Ficha por completar.",
        modelo: "pin_quimbaya_culture_gallo", pos: new THREE.Vector3(-38, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 7, nombre: "Collar separador Quimbaya", cultura: "Quimbaya (fecha: por completar)", museo: "Museo de América, Madrid", pais: "España",
        descripcion: "Collar separador formado por 11 cuentas tubulares unidas en una barra. Ficha por completar: fecha, técnica y n.º de objeto.",
        modelo: "collar_separador_quimbaya", pos: new THREE.Vector3(-32, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 13, nombre: "Pendant Quimbaya Tres", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Colgante Quimbaya 3. Ficha por completar.",
        modelo: "pendant_quimbaya_culture_tres", pos: new THREE.Vector3(-26, 0, 36), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 12, nombre: "Pendant Quimbaya", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Colgante Quimbaya. Ficha por completar.",
        modelo: "pendant_quimbaya_culture", pos: new THREE.Vector3(-26, 0, 32), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 11, nombre: "Necklace Piece Quimbaya", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Pieza de collar Quimbaya. Ficha por completar.",
        modelo: "necklace_piece_quimbaya_culture", pos: new THREE.Vector3(-26, 0, 20), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 10, nombre: "Helmet Quimbaya", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Casco Quimbaya. Ficha por completar.",
        modelo: "helmet_quimbaya_culture", pos: new THREE.Vector3(-26, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 9, nombre: "Gold Incense Burner", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Incensario de oro Quimbaya. Ficha por completar.",
        modelo: "gold_incense_burner_quimbaya_culture", pos: new THREE.Vector3(-32, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },
    {
        id: 8, nombre: "Ear Ornament Quimbaya", cultura: "Quimbaya (por completar)", museo: "Por definir", pais: "Por definir",
        descripcion: "Ornamento de oreja Quimbaya. Ficha por completar.",
        modelo: "ear_ornament_quimbaya_culture", pos: new THREE.Vector3(-35, 0, 16), centroSala: new THREE.Vector3(-32, 0, 26)
    },

    // --- SALA 3: LOS TAIRONA (Centro: -32, 0, -26) ---
    {
        id: 4, nombre: "Pectoral de Ave (Tairona)", cultura: "Tairona, siglos X–XVI, Colombia. Aleación de oro.", museo: "The Metropolitan Museum of Art (MET)", pais: "Estados Unidos",
        descripcion: "Las alas y la cola extendidas son comunes en Costa Rica y Panamá, pero aquí la pieza es más ornamentada, con trenzas, espirales y bolitas de oro típicas de la orfebrería tairona. Las garras sostienen una serpiente estilizada de dos cabezas. N.º 1974.271.12.",
        modelo: "ave_tairona", pos: new THREE.Vector3(-38, 0, -20), centroSala: new THREE.Vector3(-32, 0, -26)
    },
    {
        id: 5, nombre: "Pectoral Dorado", cultura: "Tairona, siglos X–XVI, Colombia.", museo: "The Metropolitan Museum of Art (MET)", pais: "Estados Unidos",
        descripcion: "Pectoral de oro tairona, pieza de orfebrería de alta complejidad.",
        modelo: "pectoral_dorado", pos: new THREE.Vector3(-38, 0, -32), centroSala: new THREE.Vector3(-32, 0, -26)
    },

    // --- SALA 4: EL RESTO DE COLOMBIA (Centro: -16, 0, -32) ---
    {
        id: 6, nombre: "Nose Ornament (ornamento nasal)", cultura: "Colombia (origen atribuido con reservas), siglos X–XVI. Oro martillado.", museo: "The Metropolitan Museum of Art (MET)", pais: "Estados Unidos",
        descripcion: "Este ornamento nasal de lámina de oro martillada combina una pieza central en forma de media luna con dos volutas laterales. El museo lo atribuye con reservas a Colombia, y su cultura de origen no está confirmada. N.º 1974.271.64.",
        modelo: "nariguera_dorada", pos: new THREE.Vector3(-16, 0, -38), centroSala: new THREE.Vector3(-16, 0, -32)
    }
];

const botones = [];
let piezasCargadas = 0;

// Carga en cola para evitar saturación de red
PIEZAS_DATA.forEach((datos, index) => {
    setTimeout(() => {
        const p = new window.Pieza(datos, scene, datos.centroSala);
        botones.push(p.boton);
        piezasCargadas++;
        
        // Cuando todas las piezas terminen de cargar, actualizamos el mapa de sombras una sola vez
        if (piezasCargadas === PIEZAS_DATA.length && !SIN_GPU) {
            renderer.shadowMap.needsUpdate = true;
        }
    }, index * 250); 
});

window.inicializarUI();
const jugador = new window.Jugador(camera, scene, colisiones, botones);

// ===== Estado de pausa / pointer lock =====
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

    if (window.objetosFlotantes) {
        const time = reloj.getElapsedTime();
        window.objetosFlotantes.forEach(obj => {
            obj.mesh.rotation.y = time * obj.speedY;
            obj.mesh.rotation.x = time * obj.speedX;
            obj.mesh.position.y = obj.baseY + Math.sin(time * obj.floatSpeed + obj.offset) * 0.15;
        });
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