// Diccionario que mapea el ID de cada pieza con su archivo .glb y configuraciones extra.
// IMPORTANTE: Las rutas distinguen entre mayúsculas y minúsculas en GitHub Pages.
const MODELOS_GLB = {
    // --- SALA 1: QUIMBAYA ---
    1: { archivo: 'modelos/Sala1/poporo_dorado.glb', dx: 0 },
    2: { archivo: 'modelos/Sala1/pin_quimbaya_color.glb', dx: 0 },
    3: { archivo: 'modelos/Sala1/pin_quimbaya_culture.glb', dx: 0 },
    7: { archivo: 'modelos/Sala1/collar_separador_quimbaya.glb', dx: 0, alto: 0.14, ancho: 1.1, color: true, emisivo: 0x555555 },
    8: { archivo: 'modelos/Sala1/ear_ornament_quimbaya_culture.glb', dx: 0 },
    9: { archivo: 'modelos/Sala1/gold_incense_burner_quimbaya_culture.glb', dx: 0 },
    10: { archivo: 'modelos/Sala1/helmet_quimbaya_culture.glb', dx: 0 },
    11: { archivo: 'modelos/Sala1/necklace_piece_quimbaya_culture.glb', dx: 0 },
    12: { archivo: 'modelos/Sala1/pendant_quimbaya_culture.glb', dx: 0 },
    13: { archivo: 'modelos/Sala1/pendant_quimbaya_culture_tres.glb', dx: 0 },
    14: { archivo: 'modelos/Sala1/pin_quimbaya_culture_gallo.glb', dx: 0 },
    
    // --- SALA 2: TUNJOS ---
    // Asegúrate de que exista una carpeta llamada exactamente "Sala2" con estos archivos.
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

    // --- SALAS 3 Y 4 ---
    4: { archivo: 'modelos/Sala3/ave_tairona.glb', dx: 0, alto: 1.25, color: true, emisivo: 0x555555 },
    5: { archivo: 'modelos/Sala3/pectoral_dorado.glb', dx: 0 },
    6: { archivo: 'modelos/Sala4/nariguera_dorada.glb', dx: 0 },
};

// Constantes para el escalado automático de los modelos 3D
const ALTURA_FLOTANDO = 2.0; // Altura a la que levitan las piezas
const ALTO_PIEZA = 0.9;      // Altura objetivo dentro de la vitrina
const ANCHO_MAX = 1.0;       // Ancho máximo para que no atraviesen el vidrio

// Variable global para reutilizar el cargador y no saturar la memoria
let _loaderGLB = null;

function obtenerLoader() {
    if (_loaderGLB) return _loaderGLB;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
    
    _loaderGLB = new THREE.GLTFLoader();
    
    // Soporte para modelos comprimidos con DRACO (muy común en modelos 3D exportados)
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
        this.onCargado = onCargado || null; // Callback para saber cuándo terminó de cargar
        this._cargado = false;
        this.boton = null;
        this.piezaMesh = new THREE.Group(); // Grupo contenedor del modelo 3D

        // Calcula el ángulo para que la pieza mire hacia el centro de la sala
        const dx = this.centroSala.x - this.datos.pos.x;
        const dz = this.centroSala.z - this.datos.pos.z;
        this.anguloRotacion = Math.atan2(dx, dz);

        this.crearVitrina();
        this.crearModelo3D();
        this.crearBoton();
    }

    _notificarCargado() {
        if (this._cargado) return;
        this._cargado = true;
        if (this.onCargado) this.onCargado();
    }

    crearVitrina() {
        const { x, z } = this.datos.pos;
        
        // Base de la vitrina (pedestal)
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), window.matPedestal);
        pedestal.position.set(x, 0.5, z);
        pedestal.castShadow = false;
        pedestal.receiveShadow = false;
        this.scene.add(pedestal);

        // Vidrio de la vitrina
        const vitrina = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), window.matVitrina);
        vitrina.position.set(x, 1.9, z);
        vitrina.castShadow = false;
        vitrina.receiveShadow = false;
        this.scene.add(vitrina);

        // Agregamos colisión al pedestal para que el jugador no pueda atravesarlo
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
            // Si no hay modelo GLB definido, generamos una figura con código
            this.crearProcedural();
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
        const finalizar = () => { if (!resuelto) { resuelto = true; this._notificarCargado(); } };

        // Timeout de seguridad: si el archivo tarda más de 15s en cargar, usa el respaldo
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
                        
                        // Calculamos el tamaño real del modelo para escalarlo automáticamente
                        const caja = new THREE.Box3().setFromObject(modelo);
                        const tam = caja.getSize(new THREE.Vector3());
                        const centro = caja.getCenter(new THREE.Vector3());

                        // Validación para evitar modelos vacíos
                        if (tam.y === 0 || !isFinite(tam.y)) {
                            this.crearProcedural();
                            finalizar();
                            return;
                        }

                        // Escalar para que quepa en la vitrina sin importar su tamaño original
                        const anchoMax = glb.ancho || ANCHO_MAX;
                        const escala = Math.min(
                            (glb.alto || ALTO_PIEZA) / tam.y,
                            anchoMax / Math.max(tam.x, tam.z)
                        );

                        modelo.scale.setScalar(escala);
                        // Centrar el modelo perfectamente en el espacio
                        modelo.position.copy(centro).multiplyScalar(-escala);
                        modelo.position.x += (glb.dx || 0);

                        // Recorremos todas las mallas del modelo para arreglar materiales
                        modelo.traverse((child) => {
                            if (child.isMesh) {
                                // SOLUCIÓN AL APLANADO (SILUETAS): 
                                // Clonamos el material original y forzamos doble cara.
                                // Esto hace que se vean bien las piezas planas (como las diademas).
                                if (child.material) {
                                    child.material = child.material.clone();
                                    child.material.side = THREE.DoubleSide;
                                    
                                    // SOLUCIÓN A SILUETAS NEGRAS:
                                    // Si el material es estándar, ajustamos valores para que se vea sin luces complejas.
                                    if (child.material.isMeshStandardMaterial) {
                                        child.material.metalness = 0.2; // Evita el negro absoluto (sin reflejos)
                                        child.material.roughness = 0.5;
                                        
                                        // Si el modelo no trae textura, le ponemos un color dorado base
                                        if (!child.material.map && !glb.color) {
                                            child.material.color.setHex(0xffcc00);
                                            child.material.emissive.setHex(0x221100);
                                        }
                                    }
                                } else {
                                    // Fallback si el modelo no tiene material asignado
                                    child.material = new THREE.MeshStandardMaterial({
                                        color: 0xffcc00, metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide
                                    });
                                }
                                
                                // Desactivar sombras para mejorar rendimiento y evitar bugs visuales
                                child.castShadow = false;
                                child.receiveShadow = false;
                                // Evita que el modelo desaparezca por errores en el cálculo de la cámara
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
                    // IMPORTANTE: Si ves este mensaje en la consola (F12), el archivo NO se encontró.
                    // Revisa que la ruta y las mayúsculas coincidan con tu GitHub.
                    console.error(`[Pieza ${this.datos.id}] ERROR AL CARGAR: ${fuente}. Verifica la ruta y el CORS.`, error);
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
        // ========================================================
        // FIGURAS DE RESPALDO (Se usan si el .glb falla o no existe)
        // ========================================================
        
        // Respaldo específico para el Poporo Quimbaya (ID 1)
        if (this.datos.id === 1) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(-0.35, 0.1, 0), new THREE.Vector3(-0.4, -0.2, 0),
                new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.4, -0.2, 0), new THREE.Vector3(0.35, 0.1, 0), new THREE.Vector3(0, 0.35, 0)
            ]);
            const tuboPrincipal = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.08, 16, true), window.matOro);
            this.piezaMesh.add(tuboPrincipal);
            for (let i = 0; i < 3; i++) {
                const aro = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 16, 32), window.matOro);
                aro.position.set(-0.2 + (i * 0.2), -0.35, 0);
                aro.rotation.z = (i - 1) * 0.2;
                this.piezaMesh.add(aro);
            }
        // Respaldo específico para el Alfiler Quimbaya (ID 2)
        } else if (this.datos.id === 2) {
            const shapeBase = new THREE.Shape();
            shapeBase.moveTo(-0.5, -0.6); shapeBase.lineTo(0.5, -0.6);
            shapeBase.bezierCurveTo(0.6, -0.2, 0.5, 0.1, 0.2, 0.2); shapeBase.lineTo(-0.2, 0.2);
            shapeBase.bezierCurveTo(-0.5, 0.1, -0.6, -0.2, -0.5, -0.6);
            const extrudeBase = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.01, bevelThickness: 0.01 };
            const base = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeBase, extrudeBase), window.matOro);
            this.piezaMesh.add(base);
            const shapeAla = new THREE.Shape();
            shapeAla.moveTo(0, 0); shapeAla.bezierCurveTo(0.3, 0.2, 0.5, 0.1, 0.6, 0.3);
            shapeAla.bezierCurveTo(0.5, 0.4, 0.2, 0.4, 0, 0.2);
            const ala = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeAla, extrudeBase), window.matOro);
            ala.position.set(0, 0.2, 0);
            this.piezaMesh.add(ala);
            const alaEspejo = ala.clone();
            alaEspejo.scale.x = -1; alaEspejo.position.set(0.2, 0.2, 0);
            this.piezaMesh.add(alaEspejo);
            
        // Respaldo para la Sala 2 (Tunjos y figuras). 
        // Usamos el ID para variar las figuras (para que no salgan todas idénticas si falla el .glb).
        } else if (this.datos.id >= 15) {
            // Base del tunjo
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16), window.matOro);
            base.position.y = -0.4;
            this.piezaMesh.add(base);

            // Cuerpo (alterna entre cilindro y caja según el ID)
            const bodyGeo = this.datos.id % 2 === 0 ? new THREE.CylinderGeometry(0.06, 0.1, 0.5, 8) : new THREE.BoxGeometry(0.15, 0.5, 0.12);
            const body = new THREE.Mesh(bodyGeo, window.matOro);
            body.position.y = -0.1;
            this.piezaMesh.add(body);

            // Cabeza (alterna entre esfera y caja)
            const headGeo = this.datos.id % 3 === 0 ? new THREE.SphereGeometry(0.12, 16, 16) : new THREE.BoxGeometry(0.16, 0.16, 0.16);
            const head = new THREE.Mesh(headGeo, window.matOro);
            head.position.y = 0.25;
            this.piezaMesh.add(head);

            // Detalle extra (gorro) solo para algunos
            if (this.datos.id % 4 === 0) {
                const hat = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 8), window.matOro);
                hat.position.y = 0.4;
                this.piezaMesh.add(hat);
            }
        } else {
            // Respaldo genérico para cualquier otra pieza
            const base = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), window.matOro);
            base.scale.set(1.2, 0.2, 0.4); base.position.y = -0.5;
            this.piezaMesh.add(base);
            const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.6, 16), window.matOro);
            tallo.position.y = -0.1;
            this.piezaMesh.add(tallo);
            const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), window.matOro);
            cabeza.position.y = 0.3;
            this.piezaMesh.add(cabeza);
        }

        // Asegurarnos de que las figuras de respaldo tampoco proyecten sombras
        this.piezaMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = false;
                child.receiveShadow = false;
            }
        });
    }

    crearBoton() {
        const { x, z } = this.datos.pos;
        this.boton = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), window.matBoton);
        
        // Colocar el botón mirando hacia el centro de la sala
        const dirAlCentro = this.centroSala.clone().sub(new THREE.Vector3(x, 0, z));
        dirAlCentro.y = 0;
        dirAlCentro.normalize();
        this.boton.position.set(x, 1.2, z).add(dirAlCentro.clone().multiplyScalar(0.9));
        
        this.boton.rotation.y = this.anguloRotacion;
        this.boton.userData = { pieza: this.datos };
        this.scene.add(this.boton);
    }
};