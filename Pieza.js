// Archivos .glb por id de pieza y su clave para el modo sin servidor (modelos_b64.js).
// Si un .glb no carga (o el loader falla), se usa el modelo de respaldo hecho con código.
const MODELOS_GLB = {
    // dx = desplazamiento lateral dentro de la vitrina (negativo = izquierda, positivo = derecha, visto de frente)
    // ancho = (opcional) ancho máximo de ESTA pieza; si no se pone, se usa ANCHO_MAX
    1: { clave: 'poporo',   archivo: 'modelos/poporo_dorado.glb',   dx: 0 },  // Poporo Quimbaya
    4: { clave: 'ave',      archivo: 'modelos/ave_tairona.glb',     dx: 0, alto: 1.25, color: true, emisivo: 0x555555 },  // pectoral de ave tairona: modelo con la textura de la foto (sube/baja "emisivo" para más/menos brillo)
    5: { clave: 'pectoral', archivo: 'modelos/pectoral_dorado.glb', dx: 0 },  // pinzas tairona (el archivo se llama "pectoral_dorado.glb")
    6: { clave: 'nariguera', archivo: 'modelos/nariguera_dorada.glb', dx: 0 },  // ornamento nasal (generado con generar_nariguera.py)
    7: { clave: 'collar_separador_quimbaya', archivo: 'modelos/collar_separador_quimbaya.glb', dx: 0, alto: 0.14, ancho: 1.1, color: true, emisivo: 0x555555 },  // collar separador (barra de 11 cuentas, muy ancha y baja: manda el ancho)

};
const ALTURA_FLOTANDO = 2.0; // altura del CENTRO de la pieza (el pedestal llega a 1.0 y la vitrina va de 1.0 a 2.8). Sube o baja este número a gusto.
const ALTO_PIEZA = 0.9; // alto final de la pieza dentro de la vitrina (la vitrina mide 1.8)
const ANCHO_MAX = 1.0;  // ancho máximo permitido (la vitrina mide 1.2 de ancho); las piezas anchas se reducen para caber

window.Pieza = class Pieza {
    constructor(datos, scene, centroSala) {
        this.datos = datos;
        this.scene = scene;
        // Usamos el centro de la sala que nos pasen desde main.js
        this.centroSala = centroSala || new THREE.Vector3(-32, 0, 0); 
        this.boton = null;
        this.piezaMesh = new THREE.Group();

        // Calculamos el ángulo de rotación mirando hacia el centro de la sala
        const dx = this.centroSala.x - this.datos.pos.x;
        const dz = this.centroSala.z - this.datos.pos.z;
        this.anguloRotacion = Math.atan2(dx, dz);

        this.crearVitrina();
        this.crearModelo3D();
        this.crearBoton();
    }

    crearVitrina() {
        const { x, y, z } = this.datos.pos;
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), window.matPedestal);
        pedestal.position.set(x, 0.5, z);
        pedestal.castShadow = true; pedestal.receiveShadow = true;
        this.scene.add(pedestal);

        const vitrina = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 1.2), window.matVitrina);
        vitrina.position.set(x, 1.9, z);
        this.scene.add(vitrina);
    }

    crearModelo3D() {
        // Posicionar y orientar el grupo hacia el centro de la sala calculado
        const { x, z } = this.datos.pos;
        this.piezaMesh.position.set(x, 2.2, z);
        this.piezaMesh.rotation.y = this.anguloRotacion;
        this.scene.add(this.piezaMesh);

        const glb = MODELOS_GLB[this.datos.id];
        if (glb) {
            this.cargarGLB(glb);
        } else {
            this.crearProcedural();
        }
    }

    cargarGLB(glb) {
        // Si el cargador de .glb no está disponible, no se rompe nada: se usa el respaldo
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.error('GLTFLoader no está cargado. Se usa el modelo de respaldo para la pieza', this.datos.id);
            this.crearProcedural();
            return;
        }

        // Si existe window.MODELOS_B64 (modelos_b64.js) se usa eso; si no, se carga el archivo .glb
        const fuente = (window.MODELOS_B64 && window.MODELOS_B64[glb.clave]) || glb.archivo;

        try {
            new THREE.GLTFLoader().load(
                fuente,
                (gltf) => {
                    const modelo = gltf.scene;

                    // Escalar a un alto fijo y centrar en el origen del grupo
                    const caja = new THREE.Box3().setFromObject(modelo);
                    const tam = caja.getSize(new THREE.Vector3());
                    const centro = caja.getCenter(new THREE.Vector3());
                    const anchoMax = glb.ancho || ANCHO_MAX; // límite propio de la pieza (si lo tiene)
                    const escala = Math.min((glb.alto || ALTO_PIEZA) / tam.y, anchoMax / Math.max(tam.x, tam.z));
                    modelo.scale.setScalar(escala);
                    modelo.position.copy(centro).multiplyScalar(-escala);
                    modelo.position.x += (glb.dx || 0);

                    // Mismo material de oro del museo y sombras (si la pieza trae color propio, se conserva su textura)
                    modelo.traverse((child) => {
                        if (child.isMesh) {
                            if (glb.color && child.material && child.material.map) {
                                const mapa = child.material.map;
                                mapa.encoding = THREE.LinearEncoding; // el museo no usa gestión de color: así se ve como en la foto
                                child.material = new THREE.MeshStandardMaterial({
                                    map: mapa, metalness: 0.4, roughness: 0.45,
                                    emissive: (glb.emisivo !== undefined ? glb.emisivo : 0x555555), emissiveMap: mapa   // autoiluminación suave: sube/baja a gusto
                                });
                            } else {
                                child.material = window.matOro;
                            }
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    // La pieza flotando dentro de la vitrina
                    this.piezaMesh.position.y = ALTURA_FLOTANDO;
                    this.piezaMesh.add(modelo);
                },
                undefined,
                (error) => {
                    console.error('No se pudo cargar el modelo', fuente.slice(0, 60), error);
                    this.crearProcedural();
                }
            );
        } catch (e) {
            console.error('Error al iniciar la carga del modelo', e);
            this.crearProcedural();
        }
    }

    // ---------- MODELOS DE RESPALDO (hechos con código) ----------
    crearProcedural() {
        if (this.datos.id === 1) {
            // NARIGUERA
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0.35, 0),
                new THREE.Vector3(-0.35, 0.1, 0),
                new THREE.Vector3(-0.4, -0.2, 0),
                new THREE.Vector3(0, -0.3, 0),
                new THREE.Vector3(0.4, -0.2, 0),
                new THREE.Vector3(0.35, 0.1, 0),
                new THREE.Vector3(0, 0.35, 0)
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
            // PECTORAL (placa base, alas y figura)
            const shapeBase = new THREE.Shape();
            shapeBase.moveTo(-0.5, -0.6);
            shapeBase.lineTo(0.5, -0.6);
            shapeBase.bezierCurveTo(0.6, -0.2, 0.5, 0.1, 0.2, 0.2);
            shapeBase.lineTo(-0.2, 0.2);
            shapeBase.bezierCurveTo(-0.5, 0.1, -0.6, -0.2, -0.5, -0.6);

            const extrudeBase = { depth: 0.03, bevelEnabled: true, bevelSegments: 2, steps: 2, bevelSize: 0.01, bevelThickness: 0.01 };
            const base = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeBase, extrudeBase), window.matOro);
            this.piezaMesh.add(base);

            const shapeAla = new THREE.Shape();
            shapeAla.moveTo(0, 0);
            shapeAla.bezierCurveTo(0.3, 0.2, 0.5, 0.1, 0.6, 0.3);
            shapeAla.bezierCurveTo(0.5, 0.4, 0.2, 0.4, 0, 0.2);
            const ala = new THREE.Mesh(new THREE.ExtrudeGeometry(shapeAla, extrudeBase), window.matOro);
            ala.position.set(0, 0.2, 0);
            this.piezaMesh.add(ala);

            const alaEspejo = ala.clone();
            alaEspejo.scale.x = -1;
            alaEspejo.position.set(0.2, 0.2, 0);
            this.piezaMesh.add(alaEspejo);

            const cuerpo = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 16), window.matOro);
            cuerpo.position.set(0, 0.1, 0.04);
            this.piezaMesh.add(cuerpo);

            const cabeza = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), window.matOro);
            cabeza.position.set(0, 0.35, 0.04);
            this.piezaMesh.add(cabeza);

        } else {
            // PINZAS (base redonda, tallo y figura)
            const base = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 32), window.matOro);
            base.scale.set(1.2, 0.2, 0.4);
            base.position.y = -0.5;
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
            brazoIzq.rotation.z = Math.PI / 3;
            brazoIzq.position.set(-0.06, 0.2, 0);
            this.piezaMesh.add(brazoIzq);

            const brazoDer = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8), window.matOro);
            brazoDer.rotation.z = -Math.PI / 3;
            brazoDer.position.set(0.06, 0.2, 0);
            this.piezaMesh.add(brazoDer);
        }

        this.piezaMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    crearBoton() {
        const { x, z } = this.datos.pos;
        this.boton = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.1), window.matBoton);

        // El botón se coloca frente al pedestal, mirando al centro de la sala
        const dirAlCentro = this.centroSala.clone().sub(new THREE.Vector3(x, 0, z));
        dirAlCentro.y = 0; dirAlCentro.normalize();

        this.boton.position.set(x, 1.2, z).add(dirAlCentro.clone().multiplyScalar(0.9));
        this.boton.rotation.y = this.anguloRotacion;

        this.boton.userData = { pieza: this.datos };
        this.scene.add(this.boton);
    }
};