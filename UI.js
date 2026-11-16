let panelInfo;

window.inicializarUI = function() {
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
};

window.mostrarInfo = function(piezaData) {
    document.getElementById('infoTitulo').textContent = piezaData.nombre;
    document.getElementById('infoCult').textContent = `Cultura: ${piezaData.cultura}`;
    document.getElementById('infoMus').textContent = `Museo: ${piezaData.museo} (${piezaData.pais})`;
    document.getElementById('infoDesc').textContent = piezaData.descripcion;
    panelInfo.style.display = 'block';
};