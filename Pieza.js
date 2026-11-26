// Diccionario que asocia el ID de cada pieza con su archivo 3D (.glb) y ajustes extra.
// IMPORTANTE: Las rutas deben coincidir exactamente con las carpetas en tu proyecto.
const MODELOS_GLB = {
    // --- SALA 1: QUIMBAYA ---
    1: { archivo: 'modelos/Sala1/poporo_dorado.glb', dx: 0 },
    2: { archivo: 'modelos/Sala1/pin_quimbaya_color.glb', dx: 0 },
    7: { archivo: 'modelos/Sala1/collar_separador_quimbaya.glb', dx: 0, alto: 0.14, ancho: 1.1, color: true, emisivo: 0x555555 },
    8: { archivo: 'modelos/Sala1/ear_ornament_quimbaya_culture.glb', dx: 0 },
    9: { archivo: 'modelos/Sala1/gold_incense_burner_quimbaya_culture.glb', dx: 0 },
    10: { archivo: 'modelos/Sala1/helmet_quimbaya_culture.glb', dx: 0 },
    11: { archivo: 'modelos/Sala1/necklace_piece_quimbaya_culture.glb', dx: 0 },
    12: { archivo: 'modelos/Sala1/pendant_quimbaya_culture.glb', dx: 0 },
    13: { archivo: 'modelos/Sala1/pendant_quimbaya_culture_tres.glb', dx: 0 },
    14: { archivo: 'modelos/Sala1/pin_quimbaya_culture_gallo.glb', dx: 0 },
    
    // --- SALA 2: TUNJOS ---
    15: { archivo: 'modelos/Sala2/01_tunjo_femenino.glb', dx: 0 },
    16: { archivo: 'modelos/Sala2/colgante_con_pajaro.glb', dx: 0 },
    17: { archivo: 'modelos/Sala2/colgante_pajaro.glb', dx: 0 },
    18: { archivo: 'modelos/Sala2/figura_femenina_tunjo.glb', dx: 0 },
    19: { archivo: 'modelos/Sala2/figura_masculina_taburete.glb', dx: 0 },
    20: { archivo: 'modelos/Sala2/figura_masculina_tunjo.glb', dx: 0 },
    21: { archivo: 'modelos/Sala2/figura_masculina_tunjo_1991.glb', dx: 0 },
    22: { archivo: 'modelos/Sala2/figura_masculina_tunjo_2000.glb', dx: 0 },
    23: { archivo: 'modelos/Sala2/seccion_de_diadema.glb', dx: 0 },
    24: { archivo: 'modelos/Sala2/serpiente_tunjo.glb', dx: 0 },

    // --- SALA 3: TAIRONA ---
    25: { archivo: 'modelos/Sala3/ave_tairone.glb', dx: 0, alto: 1.25, color: true, emisivo: 0x555555 },
    26: { archivo: 'modelos/Sala3/campana_de_oro.glb', dx: 0 },
    27: { archivo: 'modelos/Sala3/colgante_con_figura_31.glb', dx: 0 },
    28: { archivo: 'modelos/Sala3/colgante_con_figura.glb', dx: 0 },
    29: { archivo: 'modelos/Sala3/colgante_de_campana.glb', dx: 0 },
    30: { archivo: 'modelos/Sala3/colgante_en_forma_de_figura.glb', dx: 0 },
    31: { archivo: 'modelos/Sala3/collar.glb', dx: 0 },
    32: { archivo: 'modelos/Sala3/labret_2005.glb', dx: 0 },
    33: { archivo: 'modelos/Sala3/remate_de_hueso.glb', dx: 0 },
    34: { archivo: 'modelos/Sala3/s3-05_labret_1974.glb', dx: 0 },
    35: { archivo: 'modelos/Sala3/tapa_de_labret.glb', dx: 0 },

    // --- SALA 4 ---
    6: { archivo: 'modelos/Sala4/nariguera_dorada.glb', dx: 0 },

    // --- SALA 6: ESPADA DE BOLÍVAR (ID 42) ---
    // Se le asigna un alto de 1.4 para que la espada resalte bien en la vitrina.
    42: { archivo: 'modelos/Sala6/espada_de_bolivar.glb', dx: 0, alto: 1.4, ancho: 0.8 }, 
};

// Constantes globales para el escalado automático de los modelos
const ALTURA_FLOTANDO = 2.0; // Altura a la que levita el modelo dentro de la vitrina
const ALTO_PIEZA = 0.9;      // Altura por defecto si el modelo no especifica una
const ANCHO_MAX = 1.0;       // Ancho máximo para evitar que el modelo atraviese el vidrio

// Variable para no crear un nuevo cargador en cada pieza y ahorrar memoria
let _loaderGLB = null;

function obtenerLoader() {
    if (_loaderGLB) return _loaderGLB;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
    
    _loaderGLB = new THREE.GLTFLoader();
    
    // Soporte para archivos GLB comprimidos con DRACO
    if (THREE.DRACOLoader) {
        try {
            const draco = new THREE.DRACOLoader();
            draco.setDecoderPath('https://unpkg.com/three@0.128.0/examples/js/libs/draco/gltf/');
            _loaderGLB.setDRACOLoader(draco);
        } catch (e) {
            console.warn('DRACOLoader no disponible', e);
        }
    }
    return _loaderGLB;
}

window.Pieza = class Pieza {
    constructor(datos, scene, centroSala, colisiones, onCargado) {
        this.datos = datos;
        this.scene = scene;
        this.centroSala = centroSala || new THREE.Vector3(-32, 0, 0);
        this.colisiones = colisiones || [];
        this.onCargado = onCargado || null; // Función que avisa a main.js cuando termina de cargar
        this._cargado = false;
        this.boton = null;
        this.piezaMesh = new THREE.Group(); // El contenedor donde irá el modelo 3D

        // Calcula la rotación para que la pieza mire hacia el centro de la sala
        const dx = this.centroSala.x - this.datos.pos.x;
        const dz = this.centroSala.z - this.datos.pos.z;
        this.anguloRotacion = Math.atan2(dx, dz);

        this.crearVitrina();
        this.crearModelo3D();
        this.crearBoton();
    }

    // Se llama cuando el modelo termina de cargar (o falla)
    _notificarCargado() {
        if (this._cargado) return;
        this._cargado = true;
        if (this.onCargado) this.onCargado();
    }

    crearVitrina() {
        const { x, z } = this.datos.pos;
        // El pedestal (base negra)
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), window.matPedestal);
        pedestal.position.set(x, 0.5, z);
        pedestal.castShadow = false;
        pedestal.receiveShadow = false;
        this.scene.add(pedestal);

        // El vidrio (cubo transparente)
        const vitrina = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), window.matVitrina);
        vitrina.position.set(x, 1.9, z);
        vitrina.castShadow = false;
        vitrina.receiveShadow = false;
        this.scene.add(vitrina);

        // Agrega colisión al pedestal para que el jugador no lo atraviese
        this.colisiones.push({
            minX: x - 0.75, maxX: x + 0.75,
            minZ: z - 0.75, maxZ: z + 0.75,
            minY: 0, maxY: 3
        });
    }

    crearModelo3D() {
        const { x, z } = this.datos.pos;
        this.piezaMesh.position.set(x, ALTURA_FLOTANDO, z);
        this.piezaMesh.rotation.y = this.anguloRotacion;
        this.scene.add(this.piezaMesh);

        const glb = MODELOS_GLB[this.datos.id];
        if (glb) {
            this.cargarGLB(glb);
        } else {
            this.crearProcedural(); // Si no hay archivo, genera una figura con código
            this._notificarCargado();
        }
    }

    cargarGLB(glb) {
        const loader = obtenerLoader();
        if (!loader) {
            this.crearProcedural();
            this._notificarCargado();
            return;
        }

        const fuente = glb.archivo;
        let resuelto = false;
        // Función para finalizar y avisar a main.js que ya terminó
        const finalizar = () => { if (!resuelto) { resuelto = true; this._notificarCargado(); } };

        // Si el archivo tarda más de 15 segundos (ej. mala conexión), salta el respaldo
        const timeoutId = setTimeout(() => {
            if (resuelto) return;
            console.warn(`[Pieza ${this.datos.id}] Timeout al cargar ${fuente}; usando respaldo.`);
            this.crearProcedural();
            finalizar();
        }, 15000);

        try {
            loader.load(
                fuente,
                (gltf) => {
                    clearTimeout(timeoutId);
                    if (resuelto) return;
                    try {
                        const modelo = gltf.scene;
                        
                        // Calcula la caja contenedora para saber el tamaño real del modelo
                        const caja = new THREE.Box3().setFromObject(modelo);
                        const tam = caja.getSize(new THREE.Vector3());
                        const centro = caja.getCenter(new THREE.Vector3());

                        if (tam.y === 0 || !isFinite(tam.y)) {
                            this.crearProcedural();
                            finalizar();
                            return;
                        }

                        // Escala el modelo automáticamente para que quepa en la vitrina
                        const anchoMax = glb.ancho || ANCHO_MAX;
                        const escala = Math.min(
                            (glb.alto || ALTO_PIEZA) / tam.y,
                            anchoMax / Math.max(tam.x, tam.z)
                        );

                        modelo.scale.setScalar(escala);
                        modelo.position.copy(centro).multiplyScalar(-escala);
                        modelo.position.x += (glb.dx || 0);

                        // Recorre todas las piezas del modelo para arreglar sus materiales
                        modelo.traverse((child) => {
                            if (child.isMesh) {
                                if (child.material) {
                                    // Clona el material para no afectar a otras piezas y activa doble cara (útil para piezas planas)
                                    child.material = child.material.clone();
                                    child.material.side = THREE.DoubleSide;
                                    if (child.material.isMeshStandardMaterial) {
                                        // Baja el metalness para que no se vean negros sin luces complejas
                                        child.material.metalness = 0.2;
                                        child.material.roughness = 0.5;
                                        // Si no tiene textura, le pone el color dorado base
                                        if (!child.material.map && !glb.color) {
                                            child.material.color.setHex(0xffcc00);
                                            child.material.emissive.setHex(0x221100);
                                        }
                                    }
                                } else {
                                    // Fallback por si el modelo no trae material
                                    child.material = new THREE.MeshStandardMaterial({
                                        color: 0xffcc00, metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide
                                    });
                                }
                                // Desactiva sombras para ahorrar recursos y evita bugs de cámara
                                child.castShadow = false;
                                child.receiveShadow = false;
                                child.frustumCulled = false;
                            }
                        });

                        this.piezaMesh.add(modelo);
                        console.log(`[Pieza ${this.datos.id}] Cargada con éxito: ${fuente}`);
                        finalizar();
                    } catch (e) {
                        console.warn(`[Pieza ${this.datos.id}] Error procesando GLB:`, e);
                        this.crearProcedural();
                        finalizar();
                    }
                },
                undefined,
                (error) => {
                    clearTimeout(timeoutId);
                    console.error(`[Pieza ${this.datos.id}] ERROR AL CARGAR: ${fuente}. Verifica la ruta.`, error);
                    this.crearProcedural();
                    finalizar();
                }
            );
        } catch (e) {
            clearTimeout(timeoutId);
            console.warn(`[Pieza ${this.datos.id}] Excepción al cargar GLB:`, e);
            this.crearProcedural();
            finalizar();
        }
    }

    crearProcedural() {
        // Respaldo visual simple (una espada básica) si el archivo de Bolívar falla
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), window.matOro);
        base.position.y = 0;
        this.piezaMesh.add(base);
        
        const mango = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), window.matOro);
        mango.position.y = -0.6;
        this.piezaMesh.add(mango);

        this.piezaMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
    }

    crearBoton() {
        const { x, z } = this.datos.pos;
        // Crea el cubo dorado que el jugador debe mirar y clickear
        this.boton = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), window.matBoton);
        
        // Lo coloca justo en frente de la vitrina, mirando hacia el centro de la sala
        const dirAlCentro = this.centroSala.clone().sub(new THREE.Vector3(x, 0, z));
        dirAlCentro.y = 0;
        dirAlCentro.normalize();
        this.boton.position.set(x, 1.2, z).add(dirAlCentro.clone().multiplyScalar(0.9));
        
        this.boton.rotation.y = this.anguloRotacion;
        // Asocia los datos de esta pieza al botón para saber qué mostrar al hacer clic
        this.boton.userData = { pieza: this.datos };
        this.scene.add(this.boton);
    }
};