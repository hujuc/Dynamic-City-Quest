// Array global para armazenar os postes
let streetLamps = [];
let lampMaterial = null;
let poleMaterial = null;
let glowMaterial = null;
let groundLightMaterial = null;

// Array global para armazenar objetos de colisão dos postes
window.streetLampCollisionObjects = [];

// 4 offsets para as pontas (em relação ao centro da esquina)
const CORNER_OFFSETS = [
    [ 0.7,  0.7], // canto nordeste
    [-0.7,  0.7], // canto noroeste
    [-0.7, -0.7], // canto sudoeste
    [ 0.7, -0.7], // canto sudeste
];


// Distâncias para LOD das luzes
const LIGHT_LOD_DISTANCES = {
    HIGH: 30,    // Distância para luz real
    MEDIUM: 50,  // Distância para glow + ground light
    LOW: 100     // Distância para apenas emissive
};

// Função para criar textura radial
function createRadialTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Criar gradiente radial
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(255, 211, 102, 1)');   // Cor amarela no centro
    gradient.addColorStop(0.2, 'rgba(255, 211, 102, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 211, 102, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 211, 102, 0)');   // Transparente nas bordas

    // Preencher com o gradiente
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Criar textura
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

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
            emissiveIntensity: 1.5, 
            roughness: 0.4,
            metalness: 0.2
        });
    }

    if (!glowMaterial) {
        glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            map: createRadialTexture(),
            blending: THREE.AdditiveBlending
        });
    }

    if (!groundLightMaterial) {
        groundLightMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD366,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            map: createRadialTexture(),
            blending: THREE.AdditiveBlending
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

    // Glow (plano com textura radial)
    const glowGeometry = new THREE.PlaneGeometry(4, 4);
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(x, y + 6.2, z);
    glow.lookAt(camera.position); // Sempre olhar para a câmera
    glow.visible = false; // Começar invisível

    // Luz no chão (círculo)
    const groundLightGeometry = new THREE.CircleGeometry(3, 32);
    const groundLight = new THREE.Mesh(groundLightGeometry, groundLightMaterial);
    groundLight.position.set(x, y + 0.1, z); // Ligeiramente acima do chão
    groundLight.rotation.x = -Math.PI / 2;
    groundLight.visible = false; // Começar invisível

    // Luz real (apenas para distâncias próximas)
    const light = new THREE.PointLight(0xFFD366, 3.5, 10, 2.5);
    light.position.set(x, y + 6.2, z);
    light.castShadow = false;
    light.visible = false; // Começar invisível

    // Agrupar
    const group = new THREE.Group();
    group.type = 'StreetLamp';
    group.add(pole);
    group.add(lamp);
    group.add(glow);
    group.add(groundLight);
    group.add(light);

    // Adiciona à cena
    scene.add(group);
    cityObjects.push(group);
    streetLamps.push(group);

    // --- ADICIONAR COLISÃO DO POSTE ---
    const poleRadius = 0.25; // Mesmo do poste
    const poleHeight = 6;    // Mesmo do poste

    // O centro para colisão é o centro do poste (em X,Z), na altura média do poste (y + poleHeight/2)
    const collisionSphere = {
        center: new THREE.Vector3(x, y + poleHeight/2, z),
        radius: poleRadius + 0.4 // 0.4 é margem extra de segurança, ajusta conforme teu feeling
    };
    // Adiciona ao array global
    if (window.streetLampCollisionObjects) {
        window.streetLampCollisionObjects.push(collisionSphere);
    }

    return group;
}

function addStreetLampsAtCorners(gridSize, blockSize, streetWidth, halfSize) {
    const heightOffset = 0.15; // igual ao das ruas

    // contar a quantidade de postes, contando as ruas e as esquinas:
    const maxLamps = (gridSize + 1) * (gridSize + 1);
    console.log('Quantidade de postes:', maxLamps);
    let lampCount = 0;

    for (let i = 0; i <= gridSize && lampCount < maxLamps; i++) {
        for (let j = 0; j <= gridSize && lampCount < maxLamps; j++) {
            // Centro da esquina
            let x = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
            let z = -halfSize + j * (blockSize + streetWidth) + streetWidth / 2;

            // Aleatoriamente, escolhe uma das 4 pontas da esquina
            const corner = CORNER_OFFSETS[Math.floor(Math.random() * 4)];
            const edgeDistance = streetWidth * 0.45 + 1; // quão longe do centro da esquina (ajusta este valor para afastar mais ou menos)
            x += corner[0] * edgeDistance;
            z += corner[1] * edgeDistance;

            
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
    // Acende as luzes dos postes só de noite
    const night = (timeOfDay < 0.22 || timeOfDay > 0.80);
    
    streetLamps.forEach(lamp => {
        // Encontrar os componentes do poste
        const lampMesh = lamp.children[1]; // A lâmpada é o segundo filho
        const glow = lamp.children[2];
        const groundLight = lamp.children[3];
        const realLight = lamp.children[4];
        
        // Calcular distância da câmera até a lâmpada
        const lampPosition = new THREE.Vector3();
        lampMesh.getWorldPosition(lampPosition);
        const distance = camera.position.distanceTo(lampPosition);
        
        if (night) {
            // Sempre mostrar a lâmpada emissiva
            lampMesh.material.emissiveIntensity = 1.5;
            
            // Atualizar visibilidade baseado na distância
            if (distance < LIGHT_LOD_DISTANCES.HIGH) {
                // Distância próxima: usar luz real
                realLight.visible = true;
                glow.visible = false;
                groundLight.visible = false;
            } else if (distance < LIGHT_LOD_DISTANCES.MEDIUM) {
                // Distância média: usar glow + ground light
                realLight.visible = false;
                glow.visible = true;
                groundLight.visible = true;
                
                // Atualizar glow para olhar para a câmera
                glow.lookAt(camera.position);
            } else if (distance < LIGHT_LOD_DISTANCES.LOW) {
                // Distância longa: apenas emissive
                realLight.visible = false;
                glow.visible = false;
                groundLight.visible = false;
            } else {
                // Muito longe: desativar tudo
                realLight.visible = false;
                glow.visible = false;
                groundLight.visible = false;
                lampMesh.material.emissiveIntensity = 0.7;
            }
        } else {
            // Dia: desativar todas as luzes
            realLight.visible = false;
            glow.visible = false;
            groundLight.visible = false;
            lampMesh.material.emissiveIntensity = 0.2;
        }
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
    window.streetLampCollisionObjects = []; // Limpar também os objetos de colisão
    
    // Limpar materiais compartilhados
    if (poleMaterial) {
        poleMaterial.dispose();
        poleMaterial = null;
    }
    if (lampMaterial) {
        lampMaterial.dispose();
        lampMaterial = null;
    }
    if (glowMaterial) {
        glowMaterial.dispose();
        glowMaterial = null;
    }
    if (groundLightMaterial) {
        groundLightMaterial.dispose();
        groundLightMaterial = null;
    }
}

// Exportar funções
window.createStreetLamp = createStreetLamp;
window.addStreetLampsAtCorners = addStreetLampsAtCorners;
window.updateLampLights = updateLampLights;
window.clearStreetLamps = clearStreetLamps; 
