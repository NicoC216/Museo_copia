// ============================================================
// Entorno.js
// ============================================================
window.crearMuseo = function(scene) {
    const colisiones = [];

    function crearBox(w, h, d, x, y, z, material, tieneColision = true) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        scene.add(mesh);

        if (tieneColision) {
            colisiones.push({
                minX: x - w / 2, maxX: x + w / 2,
                minZ: z - d / 2, maxZ: z + d / 2,
                minY: y - h / 2, maxY: y + h / 2
            });
        }
        return mesh;
    }

    function crearParedPuerta(x, z, w, d, esEjeX) {
        const anchoPuerta = 4;
        const altoPuerta = 4.5;
        const grosor = 0.4;

        if (esEjeX) {
            const anchoLado = (w - anchoPuerta) / 2;
            crearBox(anchoLado, window.PARED_H, grosor, x - (w / 2) + (anchoLado / 2), window.PARED_H / 2, z, window.matPared);
            crearBox(anchoLado, window.PARED_H, grosor, x + (w / 2) - (anchoLado / 2), window.PARED_H / 2, z, window.matPared);
            crearBox(anchoPuerta, window.PARED_H - altoPuerta, grosor, x, altoPuerta + (window.PARED_H - altoPuerta) / 2, z, window.matPared);
            crearBox(anchoPuerta + 0.4, 0.3, grosor + 0.2, x, altoPuerta, z, window.matOro, false);
        } else {
            const anchoLado = (d - anchoPuerta) / 2;
            crearBox(grosor, window.PARED_H, anchoLado, x, window.PARED_H / 2, z - (d / 2) + (anchoLado / 2), window.matPared);
            crearBox(grosor, window.PARED_H, anchoLado, x, window.PARED_H / 2, z + (d / 2) - (anchoLado / 2), window.matPared);
            crearBox(grosor, window.PARED_H - altoPuerta, anchoPuerta, x, altoPuerta + (window.PARED_H - altoPuerta) / 2, z, window.matPared);
            crearBox(grosor + 0.2, 0.3, anchoPuerta + 0.4, x, altoPuerta, z, window.matOro, false);
        }
    }

    function crearCartel(nombre, x, y, z, rotY) {
        const cv = document.createElement('canvas');
        cv.width = 512; cv.height = 128;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = 'rgba(15,15,15,0.95)'; ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 6; ctx.strokeRect(4, 4, 504, 120);
        ctx.fillStyle = '#f4d76a'; ctx.font = 'bold 50px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(nombre, 256, 64);
        const tex = new THREE.CanvasTexture(cv);
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
        mesh.position.set(x, y, z);
        mesh.rotation.y = rotY;
        scene.add(mesh);
    }

    // Luces: 1 punto por sala para no saturar el shader
    function addLuzSala(x, z) {
        const point = new THREE.PointLight(0xffbb55, 1.0, 22);
        point.position.set(x, 4, z);
        scene.add(point);
    }
    function addLuzCafe(x, z) {
        const point = new THREE.PointLight(0xff9955, 1.5, 24);
        point.position.set(x, 3.5, z);
        scene.add(point);
    }
    function addLuzBano(x, z) {
        const point = new THREE.PointLight(0xe0f0ff, 2.2, 20);
        point.position.set(x, 3.5, z);
        scene.add(point);
    }
    function addLuzLobby(x, z) {
        const point = new THREE.PointLight(0xffffff, 1.6, 32);
        point.position.set(x, 4.5, z);
        scene.add(point);
    }

    function crearMesaCafe(x, z) {
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 16), window.matMaderaClara);
        tapa.position.set(x, 0.95, z); tapa.castShadow = false; tapa.receiveShadow = false;
        scene.add(tapa);
        const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), window.matMetal);
        pata.position.set(x, 0.48, z);
        scene.add(pata);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 12), window.matMetal);
        base.position.set(x, 0.02, z);
        scene.add(base);
        const sillas = [
            { dx: 1.15, dz: 0, rot: Math.PI },
            { dx: -1.15, dz: 0, rot: 0 },
            { dx: 0, dz: 1.15, rot: -Math.PI / 2 },
            { dx: 0, dz: -1.15, rot: Math.PI / 2 }
        ];
        const geoSillaA = new THREE.BoxGeometry(0.45, 0.06, 0.45);
        const geoSillaR = new THREE.BoxGeometry(0.45, 0.55, 0.06);
        const geoPataS = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6);
        sillas.forEach(s => {
            const grupo = new THREE.Group();
            grupo.position.set(x + s.dx, 0, z + s.dz);
            grupo.rotation.y = s.rot;
            const asiento = new THREE.Mesh(geoSillaA, window.matTela);
            asiento.position.y = 0.45; grupo.add(asiento);
            const respaldo = new THREE.Mesh(geoSillaR, window.matTela);
            respaldo.position.set(0, 0.72, -0.2); grupo.add(respaldo);
            const pataSilla = new THREE.Mesh(geoPataS, window.matMetal);
            pataSilla.position.y = 0.22; grupo.add(pataSilla);
            scene.add(grupo);
        });
        colisiones.push({ minX: x - 1.4, maxX: x + 1.4, minZ: z - 1.4, maxZ: z + 1.4, minY: 0, maxY: 1.2 });
    }

    function crearBarraCafe(x, z, ancho, rotY) {
        const grupo = new THREE.Group();
        grupo.position.set(x, 0, z);
        grupo.rotation.y = rotY;
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ancho, 1.1, 0.9), window.matMadera);
        cuerpo.position.set(0, 0.55, 0); cuerpo.castShadow = false; grupo.add(cuerpo);
        const tapa = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.1, 0.06, 1.0), window.matMetal);
        tapa.position.set(0, 1.13, 0); grupo.add(tapa);
        const linea = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.2, 0.04, 0.02), window.matOro);
        linea.position.set(0, 0.6, 0.46); grupo.add(linea);
        scene.add(grupo);
        if (Math.abs(Math.sin(rotY)) > 0.5) {
            colisiones.push({ minX: x - 0.55, maxX: x + 0.55, minZ: z - ancho / 2, maxZ: z + ancho / 2, minY: 0, maxY: 1.2 });
        } else {
            colisiones.push({ minX: x - ancho / 2, maxX: x + ancho / 2, minZ: z - 0.55, maxZ: z + 0.55, minY: 0, maxY: 1.2 });
        }
    }

    function crearMaquinaCafe(x, y, z, rotY) {
        const grupo = new THREE.Group();
        grupo.position.set(x, y, z); grupo.rotation.y = rotY;
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.45), window.matNegro);
        cuerpo.position.set(0, 0.375, 0); grupo.add(cuerpo);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.25, 0.02),
            new THREE.MeshStandardMaterial({ color: 0x223344, emissive: 0x336699, emissiveIntensity: 0.6 }));
        panel.position.set(0, 0.58, 0.23); grupo.add(panel);
        const dispensador = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.08), window.matMetal);
        dispensador.position.set(0, 0.18, 0.24); grupo.add(dispensador);
        scene.add(grupo);
    }

    function crearPlanta(x, z, tamaño = 1) {
        const maceta = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * tamaño, 0.16 * tamaño, 0.35 * tamaño, 10), window.matMaceta);
        maceta.position.set(x, 0.175 * tamaño, z); maceta.castShadow = false; scene.add(maceta);
        const hojasConfig = [[0, 0.55, 0, 0.35], [0.15, 0.45, 0.1, 0.22], [-0.15, 0.45, -0.1, 0.22], [0.1, 0.7, -0.1, 0.20], [-0.1, 0.7, 0.1, 0.20]];
        hojasConfig.forEach(([dx, dy, dz, r]) => {
            const hoja = new THREE.Mesh(new THREE.SphereGeometry(r * tamaño, 8, 6), window.matPlanta);
            hoja.position.set(x + dx * tamaño, dy * tamaño, z + dz * tamaño); hoja.castShadow = false; scene.add(hoja);
        });
        colisiones.push({ minX: x - 0.25 * tamaño, maxX: x + 0.25 * tamaño, minZ: z - 0.25 * tamaño, maxZ: z + 0.25 * tamaño, minY: 0, maxY: 1.5 * tamaño });
    }

    function crearLamparaColgante(x, y, z) {
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, window.PARED_H - y, 6), window.matNegro);
        cable.position.set(x, (window.PARED_H + y) / 2, z); scene.add(cable);
        const pantalla = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 10, 1, true), window.matOro);
        pantalla.position.set(x, y, z); pantalla.rotation.x = Math.PI; scene.add(pantalla);
        const bombilla = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), window.matBombilla);
        bombilla.position.set(x, y - 0.12, z); scene.add(bombilla);
    }

    function crearCuadro(x, y, z, ancho, alto, rotY, colorFondo) {
        const marco = new THREE.Mesh(new THREE.BoxGeometry(ancho + 0.1, alto + 0.1, 0.04), window.matOro);
        marco.position.set(x, y, z); marco.rotation.y = rotY; scene.add(marco);
        const lienzo = new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, 0.05), new THREE.MeshStandardMaterial({ color: colorFondo, roughness: 0.6 }));
        lienzo.position.set(x, y, z); lienzo.rotation.y = rotY; scene.add(lienzo);
    }

    function crearEstanteria(x, z, ancho, rotY) {
        const grupo = new THREE.Group();
        grupo.position.set(x, 0, z); grupo.rotation.y = rotY;
        const estructura = new THREE.Mesh(new THREE.BoxGeometry(ancho, 2, 0.4), window.matMadera);
        estructura.position.set(0, 1, 0); grupo.add(estructura);
        for (let i = 0; i < 4; i++) {
            const estante = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.1, 0.05, 0.35), window.matMaderaClara);
            estante.position.set(0, 0.4 + i * 0.4, 0); grupo.add(estante);
            for (let j = 0; j < 4; j++) {
                const colores = [0xb22222, 0x228b22, 0x1e90ff, 0xdaa520];
                const prod = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), new THREE.MeshStandardMaterial({ color: colores[(i + j) % 4], roughness: 0.7 }));
                prod.position.set(-ancho / 2 + 0.25 + j * (ancho - 0.5) / 3, 0.4 + i * 0.4 + 0.125, 0.05); grupo.add(prod);
            }
        }
        scene.add(grupo);
        if (Math.abs(Math.sin(rotY)) > 0.5) {
            colisiones.push({ minX: x - 0.25, maxX: x + 0.25, minZ: z - ancho / 2, maxZ: z + ancho / 2, minY: 0, maxY: 2 });
        } else {
            colisiones.push({ minX: x - ancho / 2, maxX: x + ancho / 2, minZ: z - 0.25, maxZ: z + 0.25, minY: 0, maxY: 2 });
        }
    }

    function crearVitrina(x, y, z, ancho, rotY) {
        const grupo = new THREE.Group();
        grupo.position.set(x, y, z); grupo.rotation.y = rotY;
        const base = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.05, 0.7), window.matMaderaClara);
        base.position.set(0, 0.025, 0); grupo.add(base);
        const vidrio = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.55, 0.7), window.matVidrio);
        vidrio.position.set(0, 0.33, 0); grupo.add(vidrio);
        const colores = [0xf4a460, 0xda70d6, 0xffd700, 0x8b4513, 0xff6347];
        for (let i = 0; i < 5; i++) {
            const pastel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 10), new THREE.MeshStandardMaterial({ color: colores[i], roughness: 0.7 }));
            pastel.position.set(-ancho / 2 + 0.25 + i * (ancho - 0.5) / 4, 0.11, 0); grupo.add(pastel);
        }
        scene.add(grupo);
    }

    function crearCubiculoMejorado(x, z, rotY, esAccesible = false) {
        const grupo = new THREE.Group();
        grupo.position.set(x, 0, z);
        grupo.rotation.y = rotY;
        const W = esAccesible ? 2.0 : 1.4;
        const D = 1.8;
        const H = 2.4;
        const grosor = 0.08;
        const side1 = new THREE.Mesh(new THREE.BoxGeometry(grosor, H, D), window.matParedBano);
        side1.position.set(-W / 2, H / 2, 0); side1.castShadow = false; grupo.add(side1);
        const side2 = new THREE.Mesh(new THREE.BoxGeometry(grosor, H, D), window.matParedBano);
        side2.position.set(W / 2, H / 2, 0); side2.castShadow = false; grupo.add(side2);
        const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, grosor), window.matParedBano);
        back.position.set(0, H / 2, -D / 2); back.castShadow = false; grupo.add(back);
        const puerta = new THREE.Mesh(new THREE.BoxGeometry(W * 0.6, H * 0.9, 0.04), window.matMaderaClara);
        puerta.position.set(-W * 0.2, H * 0.45, D / 2);
        puerta.rotation.y = Math.PI / 4;
        grupo.add(puerta);
        const baseInodoro = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.4, 12), window.matPorcelana);
        baseInodoro.position.set(0, 0.2, -D / 4); baseInodoro.castShadow = false; grupo.add(baseInodoro);
        const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.15, 12), window.matPorcelana);
        taza.position.set(0, 0.45, -D / 4); grupo.add(taza);
        const asiento = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 12), window.matPorcelana);
        asiento.position.set(0, 0.53, -D / 4); asiento.rotation.x = Math.PI / 2; grupo.add(asiento);
        const tanque = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.2), window.matPorcelana);
        tanque.position.set(0, 0.7, -D / 2 + 0.15); tanque.castShadow = false; grupo.add(tanque);
        const tuberia = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), window.matAcero);
        tuberia.position.set(0, 0.9, -D / 2 + 0.15); grupo.add(tuberia);
        const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 8), window.matAcero);
        boton.position.set(0, 0.92, -D / 2 + 0.15); grupo.add(boton);
        const papel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 6), window.matAcero);
        papel.position.set(W / 2 - 0.15, 0.8, -D / 4); papel.rotation.z = Math.PI / 2; grupo.add(papel);
        if (esAccesible) {
            const barra1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), window.matAcero);
            barra1.position.set(-W / 4, 0.7, -D / 4); barra1.rotation.z = Math.PI / 2; grupo.add(barra1);
            const barra2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), window.matAcero);
            barra2.position.set(W / 4, 0.7, -D / 4); barra2.rotation.z = Math.PI / 2; grupo.add(barra2);
        }
        scene.add(grupo);
        if (Math.abs(Math.sin(rotY)) > 0.5) {
            colisiones.push({ minX: x - D / 2 - 0.1, maxX: x + D / 2 + 0.1, minZ: z - W / 2 - 0.1, maxZ: z + W / 2 + 0.1, minY: 0, maxY: H });
        } else {
            colisiones.push({ minX: x - W / 2 - 0.1, maxX: x + W / 2 + 0.1, minZ: z - D / 2 - 0.1, maxZ: z + D / 2 + 0.1, minY: 0, maxY: H });
        }
    }

    function crearUrinario(x, z, rotY) {
        const grupo = new THREE.Group();
        grupo.position.set(x, 0, z);
        grupo.rotation.y = rotY;
        const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), window.matPorcelana);
        cuerpo.scale.set(1, 1.5, 0.6); cuerpo.position.set(0, 0.8, 0.15); cuerpo.rotation.x = Math.PI / 2; grupo.add(cuerpo);
        const borde = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12, Math.PI), window.matPorcelana);
        borde.position.set(0, 1.15, 0.15); borde.rotation.x = Math.PI / 2; borde.rotation.z = Math.PI; grupo.add(borde);
        const tuberia = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6), window.matAcero);
        tuberia.position.set(0, 1.25, 0.15); grupo.add(tuberia);
        const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), window.matAcero);
        sensor.position.set(0, 1.15, 0.05); grupo.add(sensor);
        scene.add(grupo);
        colisiones.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, minY: 0, maxY: 1.3 });
    }

    function crearLavaboMultiple(x, z, rotY, cantidad) {
        const grupo = new THREE.Group();
        grupo.position.set(x, 0, z);
        grupo.rotation.y = rotY;
        const anchoTotal = cantidad * 0.8 + 0.4;
        const D = 0.6;
        const H = 0.85;
        const meson = new THREE.Mesh(new THREE.BoxGeometry(anchoTotal, 0.1, D), window.matPorcelana);
        meson.position.set(0, H, 0); meson.castShadow = false; grupo.add(meson);
        const gabinete = new THREE.Mesh(new THREE.BoxGeometry(anchoTotal - 0.1, H - 0.1, D - 0.1), window.matMadera);
        gabinete.position.set(0, (H - 0.1) / 2, 0); grupo.add(gabinete);
        const espejo = new THREE.Mesh(new THREE.BoxGeometry(anchoTotal - 0.2, 1.0, 0.03), window.matEspejo);
        espejo.position.set(0, H + 0.7, -D / 2 + 0.02); grupo.add(espejo);
        const marcoE = new THREE.Mesh(new THREE.BoxGeometry(anchoTotal, 1.1, 0.02), window.matOro);
        marcoE.position.set(0, H + 0.7, -D / 2 + 0.01); grupo.add(marcoE);
        for (let i = 0; i < cantidad; i++) {
            const offsetX = -anchoTotal / 2 + 0.4 + i * 0.8;
            const taza = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.08, 12), window.matPorcelana);
            taza.position.set(offsetX, H + 0.05, 0); grupo.add(taza);
            const grifo = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), window.matAcero);
            grifo.position.set(offsetX, H + 0.15, -D / 2 + 0.1); grupo.add(grifo);
            const pico = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), window.matAcero);
            pico.position.set(offsetX, H + 0.2, -D / 2 + 0.2); pico.rotation.x = Math.PI / 2; grupo.add(pico);
            const jabon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.08), window.matAcero);
            jabon.position.set(offsetX + 0.25, H + 0.1, -D / 2 + 0.05); grupo.add(jabon);
        }
        scene.add(grupo);
        if (Math.abs(Math.sin(rotY)) > 0.5) {
            colisiones.push({ minX: x - D / 2, maxX: x + D / 2, minZ: z - anchoTotal / 2, maxZ: z + anchoTotal / 2, minY: 0, maxY: H + 1 });
        } else {
            colisiones.push({ minX: x - anchoTotal / 2, maxX: x + anchoTotal / 2, minZ: z - D / 2, maxZ: z + D / 2, minY: 0, maxY: H + 1 });
        }
    }

    function crearPisoBano(x, z, w, d) {
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(w, d), window.matPisoBano);
        piso.rotation.x = -Math.PI / 2;
        piso.position.set(x, 0.11, z);
        piso.receiveShadow = false;
        scene.add(piso);
    }

    function crearBoteBasura(x, z) {
        const bote = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.55, 10), window.matNegro);
        bote.position.set(x, 0.275, z);
        bote.castShadow = false;
        scene.add(bote);
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.04, 10), window.matAcero);
        tapa.position.set(x, 0.57, z);
        scene.add(tapa);
        colisiones.push({ minX: x - 0.2, maxX: x + 0.2, minZ: z - 0.2, maxZ: z + 0.2, minY: 0, maxY: 0.6 });
    }

    function crearReloj(x, y, z, rotY) {
        const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 16), window.matPorcelana);
        cuerpo.position.set(x, y, z); cuerpo.rotation.x = Math.PI / 2; cuerpo.rotation.z = rotY; scene.add(cuerpo);
        const borde = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.02, 6, 16), window.matOro);
        borde.position.set(x, y, z); borde.rotation.y = rotY; scene.add(borde);
    }

    // ============================================================
    //   INSTALACIÓN CENTRAL
    // ============================================================
    window.objetosFlotantes = [];

    function crearInstalacionCentral() {
        const luzCentral = new THREE.SpotLight(0xffcc66, 2.5, 14, Math.PI / 3, 0.5, 1);
        luzCentral.position.set(0, 0.5, 0);
        luzCentral.target.position.set(0, 6, 0);
        luzCentral.castShadow = false;
        scene.add(luzCentral);
        scene.add(luzCentral.target);

        const esferaBase = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), window.matBombilla);
        esferaBase.position.set(0, 1.2, 0);
        scene.add(esferaBase);

        const NUM_PIEZAS = 10;
        const geoEsfera = new THREE.SphereGeometry(0.15, 10, 10);
        const geoOcta = new THREE.OctahedronGeometry(0.2);
        const geoTorus = new THREE.TorusGeometry(0.15, 0.05, 6, 10);
        const geoCable = new THREE.CylinderGeometry(0.01, 0.01, 1, 4);

        for (let i = 0; i < NUM_PIEZAS; i++) {
            const radio = 1.5 + Math.random() * 4.5;
            const angulo = Math.random() * Math.PI * 2;
            const x = Math.cos(angulo) * radio;
            const z = Math.sin(angulo) * radio;
            const y = 2.5 + Math.random() * 3.0;

            const alturaCable = 6 - y;
            const cable = new THREE.Mesh(geoCable, window.matAcero);
            cable.scale.y = alturaCable;
            cable.position.set(x, y + alturaCable / 2, z);
            scene.add(cable);

            let geo;
            const tipo = Math.floor(Math.random() * 3);
            if (tipo === 0) geo = geoEsfera;
            else if (tipo === 1) geo = geoOcta;
            else geo = geoTorus;

            const pieza = new THREE.Mesh(geo, window.matOro);
            pieza.position.set(x, y, z);
            pieza.castShadow = false;
            scene.add(pieza);

            window.objetosFlotantes.push({
                mesh: pieza,
                baseY: y,
                speedY: (Math.random() - 0.5) * 1.5,
                speedX: (Math.random() - 0.5) * 1.5,
                floatSpeed: 1 + Math.random() * 2,
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    // ============================================================
    //   CONSTRUCCIÓN DEL MUSEO
    // ============================================================
    const pisoMesh = crearBox(80, 0.2, 80, 0, -0.1, 0, window.matPiso, false);
    pisoMesh.receiveShadow = !SIN_GPU;
    crearBox(80, 0.2, 80, 0, 6, 0, window.matTecho, false);
    crearBox(24, 0.1, 24, 0, 0.05, 0, window.matPisoPatio, false);
    crearBox(4, 1, 4, 0, 0.5, 0, window.matOro);

    crearInstalacionCentral();

    crearBox(80, window.PARED_H, 0.5, 0, window.PARED_H / 2, -40, window.matMuroExterior);
    crearParedPuerta(0, 40, 80, 0.5, true);
    crearBox(0.5, window.PARED_H, 80, -40, window.PARED_H / 2, 0, window.matMuroExterior);
    crearBox(0.5, window.PARED_H, 80, 40, window.PARED_H / 2, 0, window.matMuroExterior);

    crearParedPuerta(-24, 26, 0.4, 28, false);
    crearParedPuerta(-24, 0, 0.4, 24, false);
    crearParedPuerta(-24, -26, 0.4, 28, false);
    crearBox(16, window.PARED_H, 0.4, -32, window.PARED_H / 2, 12, window.matPared);
    crearBox(16, window.PARED_H, 0.4, -32, window.PARED_H / 2, -12, window.matPared);

    crearParedPuerta(24, 26, 0.4, 28, false);
    crearParedPuerta(24, 0, 0.4, 24, false);
    crearParedPuerta(24, -26, 0.4, 28, false);
    crearBox(16, window.PARED_H, 0.4, 32, window.PARED_H / 2, 12, window.matPared);
    crearBox(16, window.PARED_H, 0.4, 32, window.PARED_H / 2, -12, window.matPared);

    crearParedPuerta(-16, -24, 16, 0.4, true);
    crearParedPuerta(0, -24, 16, 0.4, true);
    crearParedPuerta(16, -24, 16, 0.4, true);
    crearBox(0.4, window.PARED_H, 16, -8, window.PARED_H / 2, -32, window.matPared);
    crearBox(0.4, window.PARED_H, 16, 8, window.PARED_H / 2, -32, window.matPared);

    crearBox(0.5, window.PARED_H, 0.5, -11, window.PARED_H / 2, 11, window.matPared, false);
    crearBox(0.5, window.PARED_H, 0.5, 11, window.PARED_H / 2, 11, window.matPared, false);
    crearBox(0.5, window.PARED_H, 0.5, -11, window.PARED_H / 2, -11, window.matPared, false);
    crearBox(0.5, window.PARED_H, 0.5, 11, window.PARED_H / 2, -11, window.matPared, false);

    crearCartel("Sala 1", -23.7, 3.5, 26, Math.PI / 2);
    crearCartel("Sala 2", -23.7, 3.5, 0, Math.PI / 2);
    crearCartel("Sala 3", -23.7, 3.5, -26, Math.PI / 2);
    crearCartel("Sala 4", -16, 3.5, -23.7, 0);
    crearCartel("Sala 5", 0, 3.5, -23.7, 0);
    crearCartel("Sala 6", 16, 3.5, -23.7, 0);
    crearCartel("Cafetería", 23.7, 3.5, 26, -Math.PI / 2);
    crearCartel("Baño 1", 23.7, 3.5, 0, -Math.PI / 2);
    crearCartel("Baño 2", 23.7, 3.5, -26, -Math.PI / 2);

    addLuzSala(-32, 26); addLuzSala(-32, 0); addLuzSala(-32, -26);
    addLuzSala(-16, -32); addLuzSala(0, -32); addLuzSala(16, -32);
    addLuzCafe(32, 26);
    addLuzBano(32, -6); addLuzBano(32, -30);
    addLuzLobby(0, 30);

    // ============================================================
    //   DECORACIÓN CAFETERÍA
    // ============================================================
    crearBarraCafe(32, 13.5, 12, 0);
    crearMaquinaCafe(27, 1.16, 13.5, 0);
    crearMaquinaCafe(35, 1.16, 13.5, 0);
    crearVitrina(31, 1.16, 13.5, 3, 0);
    crearMesaCafe(27, 20);
    crearMesaCafe(37, 20);
    crearMesaCafe(27, 31);
    crearMesaCafe(37, 31);
    crearEstanteria(24.7, 35, 3, Math.PI / 2);
    crearBox(0.6, 2.0, 1.2, 39.4, 1.0, 33, window.matPorcelana);
    crearBox(0.05, 1.8, 1.0, 39.08, 1.0, 33, window.matNegro, false);
    crearPlanta(38.5, 38.5, 1.1);
    crearPlanta(25.5, 38.5, 1.1);
    crearPlanta(38.5, 15, 1.0);
    crearBoteBasura(38.5, 12.5);
    crearLamparaColgante(27, 3.2, 20);
    crearLamparaColgante(37, 3.2, 20);
    crearLamparaColgante(27, 3.2, 31);
    crearLamparaColgante(37, 3.2, 31);
    crearCuadro(32, 3.2, 12.4, 2.0, 0.8, 0, 0x2c3e50);
    crearCuadro(27, 2.5, 39.65, 1.4, 1.0, 0, 0x4a2c5a);
    crearCuadro(37, 2.5, 39.65, 1.4, 1.0, 0, 0x1e5a3c);
    crearCuadro(39.65, 2.5, 24, 1.2, 0.9, -Math.PI / 2, 0x6b4423);
    crearReloj(32, 4.2, 12.4, 0);

    // ============================================================
    //   DECORACIÓN BAÑO 1
    // ============================================================
    crearPisoBano(32, 0, 16, 24);
    crearCubiculoMejorado(38.5, -8, -Math.PI / 2, false);
    crearCubiculoMejorado(38.5, -6, -Math.PI / 2, false);
    crearCubiculoMejorado(38.5, 2, -Math.PI / 2, false);
    crearCubiculoMejorado(38.5, 4, -Math.PI / 2, false);
    crearUrinario(25.5, -8, Math.PI / 2);
    crearUrinario(25.5, -5.5, Math.PI / 2);
    crearUrinario(25.5, -3, Math.PI / 2);
    crearLavaboMultiple(31, -10.5, 0, 3);
    const espejoB1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.05), window.matEspejo);
    espejoB1.position.set(31, 1.8, -11.7); scene.add(espejoB1);
    crearBoteBasura(38.5, -2);
    crearPlanta(25.3, 10.5, 0.7);

    // ============================================================
    //   DECORACIÓN BAÑO 2
    // ============================================================
    crearPisoBano(32, -26, 16, 28);
    crearCubiculoMejorado(38.5, -36, -Math.PI / 2, false);
    crearCubiculoMejorado(38.5, -33, -Math.PI / 2, false);
    crearCubiculoMejorado(38.5, -27, -Math.PI / 2, true);
    crearUrinario(25.5, -36, Math.PI / 2);
    crearUrinario(25.5, -33.5, Math.PI / 2);
    crearUrinario(25.5, -31, Math.PI / 2);
    crearLavaboMultiple(32, -38.5, 0, 3);
    const espejoB2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 0.05), window.matEspejo);
    espejoB2.position.set(32, 1.8, -39.7); scene.add(espejoB2);
    crearBoteBasura(38.5, -24);
    crearPlanta(25.3, -15.5, 0.7);

    return colisiones;
};