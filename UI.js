let panelInfo;
let modalCarta;
let modalPergamino;

window.inicializarUI = function() {
    // Panel de piezas de oro
    panelInfo = document.createElement('div');
    panelInfo.id = 'panelInfo';
    panelInfo.innerHTML = `
        <h2 id="infoTitulo"></h2>
        <p id="infoCult" class="cult"></p>
        <p id="infoMus" class="mus"></p>
        <p id="infoDesc" class="desc"></p>
        <button id="btnCerrarInfo">Cerrar</button>
    `;
    document.body.appendChild(panelInfo);

    document.getElementById('btnCerrarInfo').addEventListener('click', () => {
        panelInfo.style.display = 'none';
    });

    // Modal para la Espada de Bolívar
    modalCarta = document.createElement('div');
    modalCarta.id = 'modalCarta';
    modalCarta.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); border: 2px solid #c9a227; border-radius: 10px;
        padding: 20px; color: #e8d9a8; display: none; z-index: 100;
        text-align: center; font-family: 'Georgia', serif; box-shadow: 0 0 20px rgba(201,162,39,0.3);
        flex-direction: column; align-items: center; max-width: 90vw;
    `;

    modalCarta.innerHTML = `
        <h2 id="tituloCarta" style="color:#e6c65c; margin-bottom: 15px;"></h2>
        <img id="imgCarta" src="" alt="Carta" style="max-width: 70vw; max-height: 60vh; border: 2px solid #333; border-radius: 5px; object-fit: contain;">
        <div style="display: flex; justify-content: space-between; width: 100%; margin-top: 20px;">
            <button id="btnFlechaIzq" style="background: #c9a227; color: #000; border: none; border-radius: 5px; padding: 10px 20px; font-size: 20px; cursor: pointer; font-weight: bold;">&#8592;</button>
            <button id="btnCerrarCarta" style="background: #444; color: #e8d9a8; border: 1px solid #c9a227; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Cerrar</button>
            <button id="btnFlechaDer" style="background: #c9a227; color: #000; border: none; border-radius: 5px; padding: 10px 20px; font-size: 20px; cursor: pointer; font-weight: bold;">&#8594;</button>
        </div>
    `;
    document.body.appendChild(modalCarta);

    document.getElementById('btnCerrarCarta').addEventListener('click', () => { modalCarta.style.display = 'none'; });
    document.getElementById('btnFlechaDer').addEventListener('click', () => { window.location.href = 'https://ximenaflechas8a.github.io/museo-colombia/'; });
    document.getElementById('btnFlechaIzq').addEventListener('click', () => { alert('¡Museo por completar! Pronto enlazaremos otra sala.'); });

    // Modal para los Pergaminos
    modalPergamino = document.createElement('div');
    modalPergamino.id = 'modalPergamino';
    modalPergamino.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(15, 12, 8, 0.98); border: 2px solid #a87b32; border-radius: 10px;
        padding: 30px; color: #e8d9a8; display: none; z-index: 100;
        text-align: center; font-family: 'Georgia', serif; box-shadow: 0 0 30px rgba(168,123,50,0.5);
        flex-direction: column; align-items: center; max-width: 80vw;
        background-image: url('data:image/svg+xml;utf8,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100" height="100" filter="url(%23noise)" opacity="0.1"/></svg>');
    `;

    modalPergamino.innerHTML = `
        <h2 id="tituloPergamino" style="color:#d4af37; margin-bottom: 20px; font-size: 28px;"></h2>
        <img id="imgPergamino" src="" alt="Pergamino" style="max-width: 50vw; max-height: 50vh; border: 2px solid #5a3d23; border-radius: 5px; object-fit: contain; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
        <p id="textoPergamino" style="font-size: 16px; line-height: 1.6; max-width: 600px; font-style: italic; color: #d1c7b8; margin-bottom: 20px;"></p>
        <button id="btnCerrarPergamino" style="background: #a87b32; color: #000; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer; font-weight: bold; font-size: 16px;">Guardar Fragmento</button>
    `;
    document.body.appendChild(modalPergamino);

    document.getElementById('btnCerrarPergamino').addEventListener('click', () => {
        modalPergamino.style.display = 'none';
    });

    // Inicializar contador visual
    actualizarContadorPergaminos();
};

// --- LÓGICA DE PERGAMINOS ---
window.abrirPergamino = function(data) {
    // Obtener recolectados de localStorage
    let recolectados = JSON.parse(localStorage.getItem('pergaminosRecolectados')) || [];
    
    // Si no está recolectado, añadirlo
    if (!recolectados.includes(data.id)) {
        recolectados.push(data.id);
        localStorage.setItem('pergaminosRecolectados', JSON.stringify(recolectados));
        actualizarContadorPergaminos();
    }

    const titulo = document.getElementById('tituloPergamino');
    const img = document.getElementById('imgPergamino');
    const texto = document.getElementById('textoPergamino');
    const btn = document.getElementById('btnCerrarPergamino');

    // Si ya tiene los 6, el botón dice "Ver Pergamino Completo"
    if (recolectados.length >= 6) {
        titulo.textContent = "¡Pergamino Completado!";
        texto.textContent = "Has unido todos los fragmentos. La historia está completa.";
        img.src = 'modelos/Pergaminos/completa.png'; // Muestra la imagen final
        btn.textContent = "Cerrar Crónica";
    } else {
        titulo.textContent = `Fragmento ${data.id} - ${data.sala}`;
        texto.textContent = data.texto;
        img.src = data.img;
        btn.textContent = "Guardar Fragmento";
    }

    modalPergamino.style.display = 'flex';
};

window.actualizarContadorPergaminos = function() {
    const recolectados = JSON.parse(localStorage.getItem('pergaminosRecolectados')) || [];
    const hud = document.getElementById('hud-pergaminos');
    if (hud) {
        if (recolectados.length >= 6) {
            hud.textContent = "¡Pergamino Completo (6/6)!";
            hud.style.color = "#00ff00";
            hud.style.borderColor = "#00ff00";
        } else {
            hud.textContent = `Pergamino incompleto (${recolectados.length}/6)`;
        }
    }
};

// --- LÓGICA NORMAL DE PIEZAS ---
window.mostrarInfo = function(piezaData) {
    if (piezaData.id === 42) {
        document.getElementById('tituloCarta').textContent = piezaData.nombre;
        document.getElementById('imgCarta').src = 'modelos/Sala6/carta_museo_del_oro.png'; 
        modalCarta.style.display = 'flex';
    } else {
        document.getElementById('infoTitulo').textContent = piezaData.nombre;
        document.getElementById('infoCult').textContent = `Cultura: ${piezaData.cultura}`;
        document.getElementById('infoMus').textContent = `Museo: ${piezaData.museo} (${piezaData.pais})`;
        document.getElementById('infoDesc').textContent = piezaData.descripcion;
        panelInfo.style.display = 'block';
    }
};