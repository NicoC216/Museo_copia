let panelInfo;   // Panel para piezas normales
let modalCarta;  // Panel especial para la Carta de la Espada de Bolívar

window.inicializarUI = function() {
    // 1. Creamos el panel normal de información
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

    // 2. Creamos el modal para la imagen de la carta
    modalCarta = document.createElement('div');
    modalCarta.id = 'modalCarta';
    // Estilos en línea para asegurar que se vea bien sin depender de archivos externos
    modalCarta.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(10, 10, 10, 0.95); border: 2px solid #c9a227; border-radius: 10px;
        padding: 20px; color: #e8d9a8; display: none; z-index: 100;
        text-align: center; font-family: 'Georgia', serif; box-shadow: 0 0 20px rgba(201,162,39,0.3);
        flex-direction: column; align-items: center; max-width: 90vw;
    `;

    // Estructura interna del modal (imagen + 3 botones)
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

    // Eventos de los botones del modal
    document.getElementById('btnCerrarCarta').addEventListener('click', () => {
        modalCarta.style.display = 'none';
    });

    // Botón de la flecha derecha: Redirige al otro museo
    document.getElementById('btnFlechaDer').addEventListener('click', () => {
        window.location.href = 'https://ximenaflechas8a.github.io/museo-colombia/';
    });

    // Botón de la flecha izquierda: Mensaje temporal
    document.getElementById('btnFlechaIzq').addEventListener('click', () => {
        alert('¡Museo por completar! Pronto enlazaremos otra sala.');
    });
};

// Esta función decide qué mostrar dependiendo de qué pieza se hizo clic
window.mostrarInfo = function(piezaData) {
    // Si la pieza es la Espada de Bolívar (ID 42), abre el modal de la imagen
    if (piezaData.id === 42) {
        document.getElementById('tituloCarta').textContent = piezaData.nombre;
        document.getElementById('imgCarta').src = 'modelos/Sala6/carta_museo_del_oro.png'; // Ruta de la imagen
        modalCarta.style.display = 'flex';
    } else {
        // Para las demás piezas, muestra el texto normal
        document.getElementById('infoTitulo').textContent = piezaData.nombre;
        document.getElementById('infoCult').textContent = `Cultura: ${piezaData.cultura}`;
        document.getElementById('infoMus').textContent = `Museo: ${piezaData.museo} (${piezaData.pais})`;
        document.getElementById('infoDesc').textContent = piezaData.descripcion;
        panelInfo.style.display = 'block';
    }
};