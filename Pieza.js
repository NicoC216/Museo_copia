// ============================================================
// Pieza.js
// ============================================================
const MODELOS_GLB = {
    1: { archivo: 'modelos/Sala1/poporo_dorado.glb', dx: 0 },
    2: { archivo: 'modelos/Sala1/pin_quimbaya_color.glb', dx: 0 },
    3: { archivo: 'modelos/Sala1/pin_quimbaya_culture.glb', dx: 0 },
    4: { archivo: 'modelos/Sala3/ave_tairona.glb', dx: 0, alto: 1.25, color: true, emisivo: 0x555555 },
    5: { archivo: 'modelos/Sala3/pectoral_dorado.glb', dx: 0 },
    6: { archivo: 'modelos/Sala4/nariguera_dorada.glb', dx: 0 },
    7: { archivo: 'modelos/Sala1/collar_separador_quimbaya.glb', dx: 0, alto: 0.14, ancho: 1.1, color: true, emisivo: 0x555555 },
    8: { archivo: 'modelos/Sala1/ear_ornament_quimbaya_culture.glb', dx: 0 },
    9: { archivo: 'modelos/Sala1/gold_incense_burner_quimbaya_culture.glb', dx: 0 },
    10: { archivo: 'modelos/Sala1/helmet_quimbaya_culture.glb', dx: 0 },
    11: { archivo: 'modelos/Sala1/necklace_piece_quimbaya_culture.glb', dx: 0 },
    12: { archivo: 'modelos/Sala1/pendant_quimbaya_culture.glb', dx: 0 },
    13: { archivo: 'modelos/Sala1/pendant_quimbaya_culture_tres.glb', dx: 0 },
    14: { archivo: 'modelos/Sala1/pin_quimbaya_culture_gallo.glb', dx: 0 },
};

const ALTURA_FLOTANDO = 2.0;
const ALTO_PIEZA = 0.9;
const ANCHO_MAX = 1.0;

// Loader compartido con soporte DRACO
let _loaderGLB = null;
function obtenerLoader() {
    if (_loaderGLB) return _loaderGLB;
    if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return null;
    _loaderGLB = new THREE.GLTFLoader();
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
        this.onCargado = onCargado || null;
        this._cargado = false;
        this.boton = null;
        this.piezaMesh = new THREE.Group();

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
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), window.matPedestal);
        pedestal.position.set(x, 0.5, z);
        pedestal.castShadow = false;
        pedestal.receiveShadow = false;
        this.scene.add(pedestal);

        const vitrina = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), window.matVitrina);
        vitrina.position.set(x, 1.9, z);
        vitrina.castShadow = false;
        vitrina.receiveShadow = false;
        this.scene.add(vitrina);

        // Colisión del pedestal para que no se pueda atravesar
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
            this.crearProcedural();
            this._notificarCargado();
        }
    }

    cargarGLB(glb) {
        const loader = obtenerLoader();
        if (!loader) {
            console.warn(`[Pieza ${this.datos.id}] GLTFLoader no disponible; usando respaldo.`);
            this.crearProcedural();
            this._notificarCargado();
            return;
        }

        const fuente = glb.archivo;
        let resuelto = false;
        const finalizar = () => { if (!resuelto) { resuelto = true; this._notificarCargado(); } };

        // Timeout de seguridad: 12 segundos
        const timeoutId = setTimeout(() => {
            if (resuelto) return;
            console.warn(`[Pieza ${this.datos.id}] Timeout al cargar ${fuente}; usando respaldo.`);
            this.crearProcedural();
            finalizar();
        }, 12000);

        try {
            loader.load(
                fuente,
                (gltf) => {
                    clearTimeout(timeoutId);
                    if (resuelto) return;
                    try {
                        const modelo = gltf.scene;
                        const caja = new THREE.Box3().setFromObject(modelo);
                        const tam = caja.getSize(new THREE.Vector3());
                        const centro = caja.getCenter(new THREE.Vector3());

                        if (tam.y === 0 || !isFinite(tam.y)) {
                            // Modelo vacío o inválido
                            this.crearProcedural();
                            finalizar();
                            return;
                        }

                        const anchoMax = glb.ancho || ANCHO_MAX;
                        const escala = Math.min(
                            (glb.alto || ALTO_PIEZA) / tam.y,
                            anchoMax / Math.max(tam.x, tam.z)
                        );

                        modelo.scale.setScalar(escala);
                        modelo.position.copy(centro).multiplyScalar(-escala);
                        modelo.position.x += (glb.dx || 0);

                        modelo.traverse((child) => {
                            if (child.isMesh) {
                                if (glb.color && child.material && child.material.map) {
                                    const mapa = child.material.map;
                                    mapa.encoding = THREE.LinearEncoding;
                                    child.material = new THREE.MeshStandardMaterial({
                                        map: mapa, metalness: 0.4, roughness: 0.45,
                                        emissive: (glb.emisivo !== undefined ? glb.emisivo : 0x555555),
                                        emissiveMap: mapa
                                    });
                                } else {
                                    child.material = new THREE.MeshStandardMaterial({
                                        color: 0xffd700,
                                        metalness: 0.55,
                                        roughness: 0.35,
                                        emissive: 0x2a1f00
                                    });
                                }
                                child.castShadow = false;
                                child.receiveShadow = false;
                                child.frustumCulled = true;
                            }
                        });

                        this.piezaMesh.add(modelo);
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
                    console.warn(`[Pieza ${this.datos.id}] No se pudo cargar ${fuente}:`, error);
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
            const cuerpo = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 16), window.matOro);
            cuerpo.position.set(0, 0.1, 0.04);
            this.piezaMesh.add(cuerpo);
            const cabeza = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), window.matOro);
            cabeza.position.set(0, 0.35, 0.04);
            this.piezaMesh.add(cabeza);
        } else {
            const base = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), window.matOro);
            base.scale.set(1.2, 0.2, 0.4); base.position.y = -0.5;
            this.piezaMesh.add(base);
            const tallo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.6, 16), window.matOro);
            tallo.position.y = -0.1;
            this.piezaMesh.add(tallo);
            const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), window.matOro);
            cabeza.position.y = 0.3;
            this.piezaMesh.add(cabeza);
            const cuerpoFig = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.1), window.matOro);
            cuerpoFig.position.y = 0.18;
            this.piezaMesh.add(cuerpoFig);
            const brazoIzq = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), window.matOro);
            brazoIzq.rotation.z = Math.PI / 3; brazoIzq.position.set(-0.06, 0.2, 0);
            this.piezaMesh.add(brazoIzq);
            const brazoDer = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), window.matOro);
            brazoDer.rotation.z = -Math.PI / 3; brazoDer.position.set(0.06, 0.2, 0);
            this.piezaMesh.add(brazoDer);
        }

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
        const dirAlCentro = this.centroSala.clone().sub(new THREE.Vector3(x, 0, z));
        dirAlCentro.y = 0;
        dirAlCentro.normalize();
        this.boton.position.set(x, 1.2, z).add(dirAlCentro.clone().multiplyScalar(0.9));
        this.boton.rotation.y = this.anguloRotacion;
        this.boton.userData = { pieza: this.datos };
        this.scene.add(this.boton);
    }
};
