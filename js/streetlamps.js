// Array global para armazenar os postes
let streetLamps = [];
let lampMaterial = null;
let poleMaterial = null;
let shadowMapSize = 128; // Reduzido ainda mais para economizar texturas

function createStreetLamp(x, y, z) {
    // Criar materiais compartilhados se ainda não existirem
    if (!poleMaterial) {
        poleMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            metalness: 0.5,
            roughness: 0.7
        });
    }

    if (!lampMaterial) {
        lampMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD366, 
            emissive: 0xFFD366, 
            emissiveIntensity: 0.7, 
            roughness: 0.4,
            metalness: 0.2
        });
    }

    // Poste (cilindro)
    const poleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 6, 8);
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 3, z); // 3 é metade da altura do poste
    pole.castShadow = true;
    pole.receiveShadow = true;

    // Luminária (esfera)
    const lampGeometry = new THREE.SphereGeometry(0.7, 12, 12);
    const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
    lamp.position.set(x, y + 6.2, z); // topo do poste
    lamp.castShadow = true;

    // Luz real - sem sombras por padrão
    const light = new THREE.PointLight(0xFFD366, 1.2, 22, 1.4);
    light.position.set(x, y + 6.2, z);
    light.castShadow = false; // Desativar sombras por padrão
    light.visible = false; // Começar invisível

    // Agrupar
    const group = new THREE.Group();
    group.type = 'StreetLamp';
    group.add(pole);
    group.add(lamp);
    group.add(light);

    // Adiciona à cena
    scene.add(group);
    cityObjects.push(group);
    streetLamps.push(group);

    return group;
}

function addStreetLampsAtCorners(gridSize, blockSize, streetWidth, halfSize) {
    const heightOffset = 0.15; // igual ao das ruas

    // Limitar o número de postes para evitar sobrecarga
    const maxLamps = Math.min((gridSize + 1) * (gridSize + 1), 16); // Reduzido para 16 postes
    let lampCount = 0;

    for (let i = 0; i <= gridSize && lampCount < maxLamps; i++) {
        for (let j = 0; j <= gridSize && lampCount < maxLamps; j++) {
            // Calcular posição da esquina
            const x = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
            const z = -halfSize + j * (blockSize + streetWidth) + streetWidth / 2;
            
            // Calcular altura do terreno neste ponto
            let y = 0;
            if (heightData) {
                y = getTerrainHeight(x, z) + heightOffset;
            } else {
                y = heightOffset;
            }
            
            createStreetLamp(x, y, z);
            lampCount++;
        }
    }
}

function updateLampLights() {
    // Percorre cityObjects e ativa/desativa luzes dos postes conforme a hora
    const night = (timeOfDay < 0.22 || timeOfDay > 0.80);
    
    // Ativar sombras apenas para alguns postes estratégicos
    const shadowLamps = Math.min(4, streetLamps.length); // Máximo 4 postes com sombras
    
    streetLamps.forEach((lamp, index) => {
        lamp.children.forEach(child => {
            if (child.isPointLight) {
                child.visible = night;
                
                // Ativar sombras apenas para os primeiros postes
                if (index < shadowLamps) {
                    if (night && !child.castShadow) {
                        child.castShadow = true;
                        child.shadow.mapSize.width = shadowMapSize;
                        child.shadow.mapSize.height = shadowMapSize;
                        child.shadow.camera.near = 0.5;
                        child.shadow.camera.far = 30;
                    } else if (!night) {
                        child.castShadow = false;
                    }
                }
                
                // Ajustar intensidade baseado na hora
                if (night) {
                    const intensity = Math.min(1.2, Math.max(0.4, 
                        (timeOfDay < 0.22) ? 
                            (timeOfDay - 0.20) * 5 : // Amanhecer
                            (0.82 - timeOfDay) * 5  // Entardecer
                    ));
                    child.intensity = intensity;
                }
            }
        });
    });
}

// Função para limpar recursos
function clearStreetLamps() {
    streetLamps.forEach(lamp => {
        scene.remove(lamp);
        lamp.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    });
    streetLamps = [];
    
    // Limpar materiais compartilhados
    if (poleMaterial) {
        poleMaterial.dispose();
        poleMaterial = null;
    }
    if (lampMaterial) {
        lampMaterial.dispose();
        lampMaterial = null;
    }
}

// Exportar funções
window.createStreetLamp = createStreetLamp;
window.addStreetLampsAtCorners = addStreetLampsAtCorners;
window.updateLampLights = updateLampLights;
window.clearStreetLamps = clearStreetLamps; 