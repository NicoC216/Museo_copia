// Usamos window. para que las variables sean globales y visibles en otros archivos
window.OJO_Y = 1.6;
window.PARED_H = 6;

window.matPiso = new THREE.MeshStandardMaterial({ color: 0xd4d4d4, roughness: 0.2, metalness: 0.1 });
window.matPisoPatio = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
window.matPared = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.9 }); 
window.matTecho = new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide });
window.matOro = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.15, metalness: 1, emissive: 0x332200 });
window.matCafe = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.8 });
window.matMuroExterior = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
window.matVitrina = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, depthWrite: false });
window.matPedestal = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
window.matBoton = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.3, metalness: 0.8, emissive: 0x332200 });

// ===== Materiales para decoración (cafetería y baños) =====
window.matMadera      = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.75 });
window.matMaderaClara = new THREE.MeshStandardMaterial({ color: 0xa0764a, roughness: 0.65 });
window.matMetal       = new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: 0.2, metalness: 0.95 });
window.matTela        = new THREE.MeshStandardMaterial({ color: 0x34495e, roughness: 0.9 });
window.matPlanta      = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 });
window.matMaceta      = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.85 });
window.matEspejo      = new THREE.MeshStandardMaterial({ color: 0xb8d0e8, roughness: 0.02, metalness: 0.95 });
window.matNegro       = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
window.matVidrio      = new THREE.MeshStandardMaterial({ color: 0xc0e0ff, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false });
window.matBombilla    = new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffcc66, emissiveIntensity: 2 });

// Materiales de baño
window.matPorcelana   = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1, metalness: 0.05 });
window.matAcero       = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.15, metalness: 1.0 });
window.matPapel       = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.9 });

// Textura procedural de azulejos (se genera en Entorno.js pero la definimos aquí para que esté lista)
function crearTexturaAzulejo(colorBase, colorLinea, repeticiones) {
    const cv = document.createElement('canvas');
    cv.width = 256; cv.height = 256;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = colorBase; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = colorLinea; ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeticiones, repeticiones);
    return tex;
}

window.matPisoBano = new THREE.MeshStandardMaterial({ 
    map: crearTexturaAzulejo('#e0e8f0', '#b0c4d8', 4), 
    roughness: 0.3, metalness: 0.1 
});
window.matParedBano = new THREE.MeshStandardMaterial({ 
    map: crearTexturaAzulejo('#f0f4f8', '#c8d8e8', 2), 
    roughness: 0.2, metalness: 0.1 
});