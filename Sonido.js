window.GestorSonido = class GestorSonido {
    constructor() {
        // Volumen máximo que alcanzará la música (0.0 a 1.0)
        this.volumenMaximo = 0.4; 
        // Velocidad de transición (qué tan rápido sube o baja el volumen)
        this.velocidadFade = 1.5; 
        
        this.zonaActual = null;
        this.zonaObjetivo = null;
        this.estaPausado = false;

        // Diccionario con las canciones (por ahora solo la Sala 1)
        // Aquí agregarás las demás rutas cuando las tengas listas.
        this.audios = {
            'Sala1': new Audio('musica/Sala1/tesoro_quimbaya01.mp3'),
            'Sala2': null, // new Audio('musica/Sala2/cancion.mp3'),
            'Sala3': null, // new Audio('musica/Sala3/cancion.mp3'),
            'Sala4': null,
            'Sala5': null,
            'Sala6': null,
            'Cafeteria': null,
            'Bano1': null,
            'Bano2': null,
            'Lobby': null
        };

        // Configurar todos los audios para que sean en bucle y su volumen inicial sea 0
        for (const key in this.audios) {
            if (this.audios[key]) {
                this.audios[key].loop = true;
                this.audios[key].volume = 0;
            }
        }

        // Definición de los límites de cada sala (El "Sensor")
        // Basado en las coordenadas de tu Entorno.js
        this.zonas = [
            { id: 'Sala1', minX: -40, maxX: -24, minZ: 12, maxZ: 40 },
            { id: 'Sala2', minX: -40, maxX: -24, minZ: -12, maxZ: 12 },
            { id: 'Sala3', minX: -40, maxX: -24, minZ: -40, maxZ: -12 },
            { id: 'Sala4', minX: -24, maxX: -8,  minZ: -40, maxZ: -24 },
            { id: 'Sala5', minX: -8,  maxX: 8,  minZ: -40, maxZ: -24 },
            { id: 'Sala6', minX: 8,   maxX: 24, minZ: -40, maxZ: -24 },
            { id: 'Cafeteria', minX: 24, maxX: 40, minZ: 12, maxZ: 40 },
            { id: 'Bano1', minX: 24, maxX: 40, minZ: -12, maxZ: 12 },
            { id: 'Bano2', minX: 24, maxX: 40, minZ: -40, maxZ: -12 }
            // Si el jugador no está en ninguna de estas cajas, se asume que está en el 'Lobby' o pasillos.
        ];
    }

    // Esta función se llama justo cuando el jugador hace clic en "Entrar al Museo"
    iniciar() {
        this.estaPausado = false;
        // Actualizamos inmediatamente para saber dónde está el jugador
        this.actualizarZona(0, 35); 
    }

    pausar() {
        this.estaPausado = true;
        // Pausar todos los audios activos
        for (const key in this.audios) {
            if (this.audios[key] && !this.audios[key].paused) {
                this.audios[key].pause();
            }
        }
    }

    reanudar() {
        this.estaPausado = false;
        // Si hay una zona objetivo, reanudar su audio
        if (this.zonaObjetivo && this.audios[this.zonaObjetivo]) {
            this.audios[this.zonaObjetivo].play().catch(e => console.log("Audio esperando interacción"));
        }
    }

    // Calcula en qué caja (sala) está el jugador
    actualizarZona(x, z) {
        let nuevaZona = 'Lobby'; // Por defecto, si no está en ninguna caja, es Lobby

        for (let i = 0; i < this.zonas.length; i++) {
            const zona = this.zonas[i];
            if (x >= zona.minX && x <= zona.maxX && z >= zona.minZ && z <= zona.maxZ) {
                nuevaZona = zona.id;
                break;
            }
        }

        // Si el jugador cambió de sala, actualizamos el objetivo
        if (nuevaZona !== this.zonaObjetivo) {
            this.zonaObjetivo = nuevaZona;
            
            // Reproducir la nueva canción si existe y estamos en juego
            if (this.audios[this.zonaObjetivo] && !this.estaPausado) {
                this.audios[this.zonaObjetivo].play().catch(e => {
                    // Ignorar errores de reproducción (políticas del navegador)
                });
            }
        }
    }

    // Esta función se llama en cada frame del juego
    actualizar(x, z, dt) {
        if (this.estaPausado) return;

        this.actualizarZona(x, z);

        // Lógica de Fade In / Fade Out (Transiciones suaves)
        for (const key in this.audios) {
            const audio = this.audios[key];
            if (!audio) continue;

            const esZonaObjetivo = (key === this.zonaObjetivo);
            const volumenObjetivo = esZonaObjetivo ? this.volumenMaximo : 0;

            // Mover el volumen gradualmente hacia el objetivo
            if (audio.volume < volumenObjetivo) {
                audio.volume = Math.min(volumenObjetivo, audio.volume + this.velocidadFade * dt);
            } else if (audio.volume > volumenObjetivo) {
                audio.volume = Math.max(volumenObjetivo, audio.volume - this.velocidadFade * dt);
                // Si el volumen llega a 0 y no es la zona actual, pausar el audio para ahorrar recursos
                if (audio.volume === 0 && !esZonaObjetivo && !audio.paused) {
                    audio.pause();
                }
            }
        }
    }
};