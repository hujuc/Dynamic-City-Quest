// Array para armazenar as bounding boxes dos edifícios
let buildingBoxes = [];
let streetLampCollisionObjects = [];


// Adicionar variáveis para as bordas da cidade
let cityBounds = {
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0
};

function isCameraCollidingWithStreetLamps(cameraPosition) {
    if (!isFirstPersonMode()) return false;

    for (const lamp of streetLampCollisionObjects) {
        const distance = cameraPosition.distanceTo(lamp.center);
        if (distance < lamp.radius) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithTrees(cameraPosition) {
    if (!isFirstPersonMode()) return false; // Só aplica em primeira pessoa

    for (let tree of trees) {
        const sphere = tree.userData.collisionSphere;
        if (!sphere) continue;

        const distance = cameraPosition.distanceTo(sphere.center);
        if (distance < sphere.radius) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithParkObjects(position) {
    if (!isFirstPersonMode()) return false;

    for (const object of parkCollisionObjects) {
        const distance = position.distanceTo(object.center);
        if (distance < object.radius) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithLakeStones(position) {
    if (!isFirstPersonMode()) return false;

    // Adicionar uma margem de segurança à posição da câmera
    const cameraRadius = 0.5; // Raio da câmera para colisão
    const collisionMargin = 0.3; // Margem adicional de segurança

    for (const stone of stoneCollisionObjects) {
        const distance = position.distanceTo(stone.center);
        const collisionDistance = stone.radius + cameraRadius + collisionMargin;

        // Debug: Mostrar informações de colisão
        if (window.DEBUG_COLLISIONS && stone.stone) {
            const distanceToCollision = distance - collisionDistance;
            if (distanceToCollision < 1) { // Mostrar apenas quando estiver próximo
                console.log(`Distância até pedra: ${distance.toFixed(2)}, Distância de colisão: ${collisionDistance.toFixed(2)}`);
            }
        }

        if (distance < collisionDistance) {
            return true;
        }
    }
    return false;
}

function isCameraCollidingWithBuildings(cameraPosition) {
    if (!isFirstPersonMode()) return false;

    // Adicionar uma margem de segurança à posição da câmera
    const cameraRadius = 0.5; // Raio da câmera para colisão
    const collisionMargin = 0.3; // Margem adicional de segurança

    for (const box of buildingBoxes) {
        // Expandir a bounding box para incluir a margem de segurança
        const expandedBox = box.clone().expandByScalar(cameraRadius + collisionMargin);
        
        if (expandedBox.containsPoint(cameraPosition)) {
            return true;
        }
    }
    return false;
}

// Função para mostrar as bordas da cidade
function showCityBounds() {
    // Remover bordas antigas
    scene.children.forEach(child => {
        if (child.isMesh && child.userData.isCityBound) {
            scene.remove(child);
        }
    });
    
    // Altura da borda
    const height = 100;
    
    // Material semi-transparente para as paredes
    const wallMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,    // Não escreve no depth buffer
        depthTest: true       // Testa profundidade para colisões
    });
    
    // Criar as 6 faces do cubo
    const faces = [
        // Face frontal (Z min)
        {
            size: [cityBounds.maxX - cityBounds.minX, height, 0.1],
            position: [(cityBounds.maxX + cityBounds.minX) / 2, height / 2, cityBounds.minZ]
        },
        // Face traseira (Z max)
        {
            size: [cityBounds.maxX - cityBounds.minX, height, 0.1],
            position: [(cityBounds.maxX + cityBounds.minX) / 2, height / 2, cityBounds.maxZ]
        },
        // Face esquerda (X min)
        {
            size: [0.1, height, cityBounds.maxZ - cityBounds.minZ],
            position: [cityBounds.minX, height / 2, (cityBounds.maxZ + cityBounds.minZ) / 2]
        },
        // Face direita (X max)
        {
            size: [0.1, height, cityBounds.maxZ - cityBounds.minZ],
            position: [cityBounds.maxX, height / 2, (cityBounds.maxZ + cityBounds.minZ) / 2]
        },
        // Teto
        {
            size: [cityBounds.maxX - cityBounds.minX, 0.1, cityBounds.maxZ - cityBounds.minZ],
            position: [(cityBounds.maxX + cityBounds.minX) / 2, height, (cityBounds.maxZ + cityBounds.minZ) / 2]
        }
    ];
    
    // Criar e adicionar cada face
    faces.forEach(face => {
        const geometry = new THREE.BoxGeometry(...face.size);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(...face.position);
        mesh.userData.isCityBound = true;
        mesh.renderOrder = -1; // Garantir que as paredes são renderizadas antes dos astros
        scene.add(mesh);
    });
}

// Modificar a função updateCityBounds para mostrar as bordas
function updateCityBounds(gridSize, blockSize, streetWidth) {
    const totalSize = (gridSize * blockSize) + ((gridSize + 1) * streetWidth);
    const halfSize = totalSize / 2;
    
    // Adicionar uma margem de segurança
    const margin = 5;
    
    cityBounds = {
        minX: -halfSize - margin,
        maxX: halfSize + margin,
        minZ: -halfSize - margin,
        maxZ: halfSize + margin
    };
    
    // Mostrar bordas se estiver em modo debug
    showCityBounds();
}

// Modificar a função checkCollisions para verificar colisão com as paredes
function checkCollisions(newPosition) {
    // Verificar colisão com as bordas da cidade
    const margin = 0.5; // Margem de segurança
    
    // Verificar colisão com cada parede
    if (newPosition.x < cityBounds.minX + margin) {
        newPosition.x = cityBounds.minX + margin;
        return false;
    }
    if (newPosition.x > cityBounds.maxX - margin) {
        newPosition.x = cityBounds.maxX - margin;
        return false;
    }
    if (newPosition.z < cityBounds.minZ + margin) {
        newPosition.z = cityBounds.minZ + margin;
        return false;
    }
    if (newPosition.z > cityBounds.maxZ - margin) {
        newPosition.z = cityBounds.maxZ - margin;
        return false;
    }
    if (newPosition.y > 100 - margin) { // Altura máxima
        newPosition.y = 100 - margin;
        return false;
    }
    
    // Só bloquear atravessar edifícios em primeira pessoa
    if (typeof isFirstPersonMode === "function" && isFirstPersonMode()) {
        for (const bbox of buildingBoxes) {
            if (bbox.containsPoint(newPosition)) {
                return false; // Colisão detectada
            }
        }
    }
    if (isCameraCollidingWithStreetLamps(newPosition)) {
        return false;
    }
    
    return true; // Sem colisão
}

// Exportar a função updateCityBounds
window.updateCityBounds = updateCityBounds;
