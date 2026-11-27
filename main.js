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
    // --- SALA 1: EL TESORO QUIMBAYA ---
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

    // --- SALA 2: TUNJOS ---
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

    // --- SALA 3: TAIRONA ---
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

    // --- SALA 4: EL RESTO DE COLOMBIA ---
    // Distribución: Fondo (Z=-38), Laterales (X=-22 y X=-10), Centro-fondo (Z=-34)
    {
        id: 45, nombre: "Adorno de brazo", cultura: "Calima (Yotoco), 100 a. C.–800 d. C.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Adorno de brazo. Desde el último siglo antes de la Era Común hasta el siglo IX, los orfebres del suroeste de Colombia crearon insignias corporales completas para que los líderes las lucieran en vida y tras su muerte: adornos para las orejas, diademas, pectorales y objetos en forma de pinzas que se llevaban colgados de un cordón atado al brazo. Este ejemplar presenta un rostro en relieve, bridas bilaterales y una hoja en forma de media luna en la base.",
        modelo: "adorno_de_brazo", pos: new THREE.Vector3(-21, 0, -38), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 6, nombre: "Ornamento nasal", cultura: "Colombia (origen atribuido con reservas), siglos X–XVI. Oro martillado.", museo: "The Met (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Ornamento nasal. Ornamento nasal de lámina de oro martillada, con una pieza central en forma de media luna y dos volutas laterales. El museo lo atribuye con reservas a Colombia y su cultura de origen no está confirmada.",
        modelo: "nariguera_dorada", pos: new THREE.Vector3(-16, 0, -38), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 46, nombre: "Adorno nasal ", cultura: "Zenú, 1–1000 d. C.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Adorno nasal. Los adornos nasales se hicieron en multitud de formas y estilos a lo largo de milenios, y las figuras humanas en cerámica y metal muestran cómo se usaban. Los adornos largos y pesados con extremos anchos, como este, se colocan en el tabique nasal. Los de la región zenú, en el noroeste de Colombia, suelen hacerse con delicada filigrana fundida de elementos trenzados y en espiral.",
        modelo: "adorno_nasal", pos: new THREE.Vector3(-11, 0, -38), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 51, nombre: "Remate con forma de pájaro", cultura: "Zenú o sinú, siglos V–X ·", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Remate con forma de pájaro. Remate de oro con forma de pájaro. El Met lo atribuye a la cultura zenú o sinú sin decidir entre ambas. Pendiente: el archivo fuente no trae descripción de esta pieza; se deja solo lo que dice la ficha.",
        modelo: "remate_con_forma_de_pajaro", pos: new THREE.Vector3(-16, 0, -34), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 47, nombre: "Adorno para la oreja", cultura: "Zenú, 1–1000 d. C.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Adorno para la oreja. Adorno para la oreja hecho a la cera perdida. La pieza completa se modeló en cera en una sola etapa y parece filigrana, pero esos elementos en forma de alambre se construyeron en cera y luego se fundieron en metal. En la superficie de ambos lados se ven granos metálicos grandes, de forma arborescente, lo que sugiere que el molde se precalentó y el metal se enfrió lentamente.",
        modelo: "adorno_para_la_oreja", pos: new THREE.Vector3(-22, 0, -32), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 43, nombre: "Colgante Tolima", cultura: "Tolima siglos V-X", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Colgante Tolima. Los tolima del valle del Magdalena hicieron durante siglos colgantes casi planos, de contornos nítidos y simétricos, con rasgos humanos y animales, que se llevaban al cuello colgados de cordones. Sus referencias animales (murciélagos, aves, serpientes) se han relacionado con el chamanismo.",
        modelo: "colgante_tolima", pos: new THREE.Vector3(-22, 0, -28), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 48, nombre: "Adorno para tocado", cultura: "Calima (Yotoco), 100 a. C.–700 d. C.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Adorno para tocado. Cinco rayos salen a cada lado de este adorno de tocado, alrededor de dos medias lunas centrales y de un rostro en alto relieve. Los rayos podrían imitar el plumaje de un tocado de plumas. Cada dos rayos llevan colgantes sujetos con pequeños alambres de oro, que aumentan de seis a ocho y a diez de arriba abajo; faltan tres en el rayo inferior derecho. Al moverse quien lo llevaba, los colgantes se balanceaban y tintineaban.",
        modelo: "adorno_para_tocado", pos: new THREE.Vector3(-22, 0, -36), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 49, nombre: "Cabeza de bastón de búho", cultura: "Zenú, 1–1000 d. C.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Cabeza de bastón de búho. Se cree que los remates de bastón de las tierras bajas del noroeste del Caribe colombiano se colocaban en bastones de rango o de oficio. Tienen una tapa en forma de dedal rematada con aves, animales locales y figuras humanas en tres dimensiones. Este büho posado en el borde tiene la cabeza ancha, girada en ángulo recto respecto al cuerpo, con ojos circulares y pico pronunciado, enmarcada por un elemento trenzado y coronada por una cresta estriada. El pecho es de filigrana calada fundida, en contraste con las alas pulidas.",
        modelo: "cabeza_de_baston_de_buho", pos: new THREE.Vector3(-10, 0, -32), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 50, nombre: "Pectoral con cara", cultura: "Calima (Yotoco), siglos I–VII", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Pectoral con cara. Un gran colgante nasal en forma de H oculta casi por completo el rostro en el centro de este pectoral con forma de riñón. Ambas formas son características del arte calima del período Yotoco, la segunda de tres sociedades (Ilama, Yotoco-Malagana y Sonso) que ocuparon sucesivamente el Valle del Cauca y que se conocen en conjunto como cultura calima.",
        modelo: "pectoral_con_cara", pos: new THREE.Vector3(-10, 0, -36), centroSala: new THREE.Vector3(-16, 0, -32)
    },
    {
        id: 44, nombre: "Pinzas", cultura: "siglos V–X.", museo: "The Metropolitan Museum of Art (Nueva York, EE. UU.)", pais: "Estados Unidos",
        descripcion: "Pinzas de oro. Pinzas de oro rematadas en una figurita con tocado de puntas sobre una base en forma de media luna. El Met no las asigna a una cultura, solo a Colombia: la orfebrería incluía objetos de uso personal o cotidiano, no solo ornamentos.",
        modelo: "pinzas", pos: new THREE.Vector3(-10, 0, -28), centroSala: new THREE.Vector3(-16, 0, -32)
    },

    // --- SALA 5: DOCUMENTOS Y PERIÓDICOS ---
    // Distribuidos en las paredes laterales de la sala 5
    {
        id: 52, nombre: "Pergamino 1", cultura: "", museo: "", pais: "",
        descripcion: "Relato del pergamino 1: Se cree que este documento fue escrito por un cronista español en el siglo XVI... (Ficha por completar)",
        modelo: "pergamino 1", pos: new THREE.Vector3(-5, 0, -36), centroSala: new THREE.Vector3(0, 0, -32)
    },
    {
        id: 53, nombre: "Pergamino 2", cultura: "", museo: "", pais: "",
        descripcion: "Relato del pergamino 2: En los archivos de Indias se encontró una carta que menciona el trueque de estas piezas... (Ficha por completar)",
        modelo: "pergamino 2", pos: new THREE.Vector3(-5, 0, -32), centroSala: new THREE.Vector3(0, 0, -32)
    },
    {
        id: 54, nombre: "Pergamino 3", cultura: "", museo: "", pais: "",
        descripcion: "Relato del pergamino 3: La ruta del oro cambió para siempre cuando los barcos partieron hacia Europa... (Ficha por completar)",
        modelo: "pergamino_3", pos: new THREE.Vector3(-5, 0, -28), centroSala: new THREE.Vector3(0, 0, -32)
    },
    {
        id: 55, nombre: "Periódico 4", cultura: "", museo: "", pais: "",
        descripcion: "Noticia del periódico 4: Hallazgo arqueológico revela la magnitud del saqueo en el siglo XIX. (Ficha por completar)",
        modelo: "periodico_4", pos: new THREE.Vector3(5, 0, -36), centroSala: new THREE.Vector3(0, 0, -32)
    },
    {
        id: 56, nombre: "Periódico 5", cultura: "", museo: "", pais: "",
        descripcion: "Noticia del periódico 5: Subasta en Londres causa polémica por la venta de piezas precolombinas. (Ficha por completar)",
        modelo: "periodico_5", pos: new THREE.Vector3(5, 0, -32), centroSala: new THREE.Vector3(0, 0, -32)
    },
    {
        id: 57, nombre: "Periódico 6", cultura: "", museo: "", pais: "",
        descripcion: "Noticia del periódico 6: Campaña internacional exige la repatriación del patrimonio colombiano. (Ficha por completar)",
        modelo: "periodico_6", pos: new THREE.Vector3(5, 0, -28), centroSala: new THREE.Vector3(0, 0, -32)
    },

    // --- SALA 6: CONEXIÓN (ESPADA DE BOLÍVAR) ---
    // AQUÍ ESTÁ LA PIEZA 33. SI NO ESTÁ, EL CONTADOR DIRÁ 32.
    {
        id: 42, nombre: "Espada de Bolívar", cultura: "Época de la Independencia", museo: "Museo del Oro (Bogotá, Colombia)", pais: "Colombia",
        descripcion: "Pieza que conecta con el Museo del Oro.",
        modelo: "espada_de_bolivar", 
        pos: new THREE.Vector3(16, 0, -32), 
        centroSala: new THREE.Vector3(16, 0, -24) 
    }
];

// ==========================================
// DATOS DE LOS PERGAMINOS (EASTER EGG)
// ==========================================
const PERGAMINOS_DATA = [
    {
        id: 1, sala: "Sala 1", pos: new THREE.Vector3(-24, 2.5, 12), 
        img: 'modelos/Pergaminos/nota_1_el_relato.png',
        texto: "Nos contaron siempre la historia de un tesoro escondido: el de un metal sagrado que desaparecía bajo el agua en medio de un ritual antiguo. Nos enseñaron a imaginarlo lejos, envuelto en misterio..."
    },
    {
        id: 2, sala: "Sala 2", pos: new THREE.Vector3(-24, 2.5, -12), 
        img: 'modelos/Pergaminos/nota_2_el_otro_rumbo.png',
        texto: "...pero mientras mirábamos hacia la leyenda, el verdadero oro seguía otro camino. Piezas fundidas para la ofrenda, hechas para quedarse en su tierra, terminaron cruzando el mar en silencio."
    },
    {
        id: 3, sala: "Sala 3", pos: new THREE.Vector3(-24, 2.5, -38), 
        img: 'modelos/Pergaminos/nota_3_la_salida.png',
        texto: "Unas salieron con sellos oficiales y firmas de cortesía; otras fueron arrancadas de la tierra sin permiso, convertidas en mercancía para vitrinas y colecciones privadas."
    },
    {
        id: 4, sala: "Sala 4", pos: new THREE.Vector3(-8, 2.5, -38), 
        img: 'modelos/Pergaminos/nota_4_la_perdida_del_origen.png',
        texto: "Con el viaje perdieron el nombre de quien las creó, el sonido de su lengua y el lugar exacto donde debían descansar. Quedó el brillo del metal, pero se borró su origen."
    },
    {
        id: 5, sala: "Sala 5", pos: new THREE.Vector3(8, 2.5, -38), 
        img: 'modelos/Pergaminos/nota_5_lo_que_no_se_vio.png',
        texto: "Algunos buscaron durante siglos secar las aguas para rescatar lo que creían perdido. No notaron que lo que realmente se había vaciado no estaba bajo el lodo, sino en nuestra propia memoria."
    },
    {
        id: 6, sala: "Sala 6", pos: new THREE.Vector3(24, 2.5, -32), 
        img: 'modelos/Pergaminos/nota_6_la_verdadera_laguna.png',
        texto: "Al final, esa es la verdadera laguna de Guatavita: no un fondo inalcanzable en las montañas, sino todas las vitrinas del mundo donde nuestro oro desapareció a plena vista."
    }
];

// ==========================================
// CREACIÓN DE LOS OBJETOS 3D DE LOS PERGAMINOS
// ==========================================
const geomPergamino = new THREE.OctahedronGeometry(0.25); // Forma de diamante/pieza
const matPergamino = new THREE.MeshStandardMaterial({ 
    color: 0xffd700, 
    emissive: 0xffaa00, 
    emissiveIntensity: 2,
    metalness: 0.8,
    roughness: 0.2
});

PERGAMINOS_DATA.forEach(pData => {
    // Objeto 3D flotante
    const mesh = new THREE.Mesh(geomPergamino, matPergamino);
    mesh.position.copy(pData.pos);
    mesh.castShadow = false;
    
    // Luz brillante para que resalte
    const luz = new THREE.PointLight(0xffaa00, 1.5, 5);
    mesh.add(luz);

    // Lo añadimos a la escena y lo guardamos en el arreglo de objetos clickeables
    scene.add(mesh);
    
    // Lo tratamos igual que un botón, pero con su propia etiqueta
    mesh.userData = { 
        esPergamino: true, 
        data: pData 
    };
    botones.push(mesh);

    // Animación de rotación para que llame la atención
    window.objetosFlotantes.push({
        mesh: mesh,
        baseY: pData.pos.y,
        speedY: 1.5,
        speedX: 1.0,
        floatSpeed: 2,
        offset: Math.random() * Math.PI * 2
    });
});

// Inicializar la UI y el contador al arrancar
window.actualizarContadorPergaminos();

// Aquí el sistema cuenta cuántos objetos hay en la lista de arriba.
// Si dice 32, es porque el objeto de arriba no se guardó en el archivo.
const botones = [];
const totalPiezas = PIEZAS_DATA.length;

// ESTE LOG DEBE IMPRIMIR 33 EN LA CONSOLA
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
    try {
        const p = new window.Pieza(datos, scene, datos.centroSala, colisiones, () => {
            piezasCargadas++;
            actualizarCarga();
        });
        botones.push(p.boton);
    } catch (error) {
        console.error(`Error crítico al generar la pieza ID ${datos.id}:`, error);
        piezasCargadas++;
        actualizarCarga();
    }
});

window.inicializarUI();
const jugador = new window.Jugador(camera, scene, colisiones, botones);

// ==========================================
// INICIALIZACIÓN DEL SONIDO
// ==========================================
let gestorSonido = null;
if (typeof window.GestorSonido !== 'undefined') {
    try {
        gestorSonido = new window.GestorSonido();
    } catch (e) {
        console.warn("No se pudo inicializar el sistema de sonido:", e);
    }
} else {
    console.warn("Sonido.js no está cargado. El museo funcionará sin audio.");
}

try { renderer.compile(scene, camera); } catch (e) {}

// ==========================================
// LÓGICA DE PAUSA Y POINTER LOCK
// ==========================================
let pausado = false;
let pointerEstuvoBloqueado = false;
let estabaMostrandoInfo = false;

function panelInfoVisible() {
    const pi = document.getElementById('panelInfo');
    const mc = document.getElementById('modalCarta');
    const piVisible = pi && pi.style.display && pi.style.display !== 'none';
    const mcVisible = mc && mc.style.display && mc.style.display !== 'none';
    return piVisible || mcVisible;
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
    
    if (gestorSonido) gestorSonido.pausar();

    const pi = document.getElementById('panelInfo');
    if (pi) pi.style.display = 'none';
    const mc = document.getElementById('modalCarta');
    if (mc) mc.style.display = 'none';

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

    if (gestorSonido) gestorSonido.reanudar();

    bloquearPuntero();
}

function salirAlIntro() {
    pausado = false;
    jugador.enJuego = false;
    if (document.pointerLockElement) document.exitPointerLock();
    
    if (gestorSonido) gestorSonido.pausar();

    const pi = document.getElementById('panelInfo');
    if (pi) pi.style.display = 'none';
    const mc = document.getElementById('modalCarta');
    if (mc) mc.style.display = 'none';

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
    if (e.target.closest('button') || e.target.closest('a')) return;
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