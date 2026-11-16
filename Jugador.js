// ============================================================
// Jugador.js
// ============================================================
window.Jugador = class Jugador {
    constructor(camera, scene, colisiones, botones) {
        this.camera = camera;
        this.scene = scene;
        this.colisiones = colisiones;
        this.botones = botones;
        this.pos = new THREE.Vector3(0, window.OJO_Y, 35);
        this.yaw = 0;
        this.pitch = 0;

        this.teclas = {};
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2(0, 0);
        this.enJuego = false;

        this.configurarControles();
    }

    configurarControles() {
        window.addEventListener('keydown', (e) => this.teclas[e.code] = true);
        window.addEventListener('keyup', (e) => this.teclas[e.code] = false);

        document.addEventListener('mousedown', (e) => {
            if (this.enJuego && e.button === 0 && document.pointerLockElement === document.body) {
                this.mouse.set(0, 0);
                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(this.botones);
                if (intersects.length > 0) {
                    this.enJuego = false;
                    document.exitPointerLock();
                    window.mostrarInfo(intersects[0].object.userData.pieza);
                }
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.enJuego || document.pointerLockElement !== document.body) return;
            this.yaw -= e.movementX * 0.002;
            this.pitch -= e.movementY * 0.002;
            this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
        });
    }

    choca(x, z, y) {
        const radio = 0.4;
        const piesY = y - window.OJO_Y;
        const cabezaY = y + 0.2;

        for (let i = 0; i < this.colisiones.length; i++) {
            const c = this.colisiones[i];
            if (cabezaY < c.minY || piesY > c.maxY) continue;
            if (x + radio > c.minX && x - radio < c.maxX &&
                z + radio > c.minZ && z - radio < c.maxZ) {
                return true;
            }
        }
        return false;
    }

    actualizar(dt) {
        if (this.enJuego) {
            let moverX = 0;
            let moverZ = 0;

            if (this.teclas['KeyW'] || this.teclas['ArrowUp']) moverZ += 1;
            if (this.teclas['KeyS'] || this.teclas['ArrowDown']) moverZ -= 1;
            if (this.teclas['KeyA'] || this.teclas['ArrowLeft']) moverX -= 1;
            if (this.teclas['KeyD'] || this.teclas['ArrowRight']) moverX += 1;

            if (moverX !== 0 || moverZ !== 0) {
                const longitud = Math.hypot(moverX, moverZ);
                moverX /= longitud;
                moverZ /= longitud;

                const corriendo = this.teclas['ShiftLeft'] || this.teclas['ShiftRight'];
                const velocidad = (corriendo ? 12 : 7) * dt;

                const forwardX = -Math.sin(this.yaw);
                const forwardZ = -Math.cos(this.yaw);
                const rightX = Math.cos(this.yaw);
                const rightZ = -Math.sin(this.yaw);

                const deltaX = (rightX * moverX) + (forwardX * moverZ);
                const deltaZ = (rightZ * moverX) + (forwardZ * moverZ);

                const nuevoX = this.pos.x + deltaX * velocidad;
                if (!this.choca(nuevoX, this.pos.z, this.pos.y)) {
                    this.pos.x = nuevoX;
                }

                const nuevoZ = this.pos.z + deltaZ * velocidad;
                if (!this.choca(this.pos.x, nuevoZ, this.pos.y)) {
                    this.pos.z = nuevoZ;
                }
            }
        }

        this.camera.position.copy(this.pos);
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }
};