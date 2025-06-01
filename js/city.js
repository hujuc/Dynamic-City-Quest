// Gerar a cidade
function generateCity() {
    // Limpar cidade existente
    clearCity();
    
    // Obter parâmetros
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const streetWidth = parseInt(document.getElementById('streetWidth').value);
    const buildingSize = parseInt(document.getElementById('buildingSize').value);
    const maxBuildingHeight = parseInt(document.getElementById('buildingHeight').value);
    const enableTerrain = document.getElementById('enableTerrain').checked;
    const terrainHeight = parseInt(document.getElementById('terrainHeight').value);
    const terrainSmoothing = parseInt(document.getElementById('terrainSmoothing').value);
    
    // Atualizar configurações de recursos
    updateParksSettings();
    updateWaterSettings();
    
    // Criar terreno (plano ou com elevação)
    if (enableTerrain && terrainHeight > 0) {
        createTerrainWithElevation(terrainHeight, terrainSmoothing);
    } else {
        createFlatTerrain();
    }
    
    // Calcular tamanho total da cidade
    const blockSize = buildingSize * 3; // 3x3 edifícios por bloco
    const totalSize = (gridSize * blockSize) + ((gridSize + 1) * streetWidth);
    const halfSize = totalSize / 2;
    
    // Criar ruas (malha de linhas para visualização)
    createStreets(gridSize, blockSize, streetWidth, halfSize);
    
    // Criar blocos da cidade (edifícios ou parques)
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            // Posição do bloco
            const blockX = -halfSize + streetWidth + (i * (blockSize + streetWidth)) + blockSize / 2;
            const blockZ = -halfSize + streetWidth + (j * (blockSize + streetWidth)) + blockSize / 2;
            
            // Decidir se este bloco será um parque ou um conjunto de edifícios
            if (parksSettings.enabled && Math.random() < parksSettings.probability) {
                // Criar um parque
                createPark(blockX, blockZ, blockSize);
            } 
            // Decidir se este bloco será um lago
            else if (waterSettings.enabled && Math.random() < waterSettings.probability) {
                // Criar um lago
                createLake(blockX, blockZ, blockSize);
            }
            else {
                // Gerar bloco 3x3 de edifícios
                createCityBlock(blockX, blockZ, buildingSize, maxBuildingHeight);
            }
        }
    }
    
    // Atualizar configurações de árvores e gerar árvores
    updateTreeSettings();
    generateTrees();
    
    // Posicionar câmera para visualizar a cidade
    camera.position.set(-halfSize - 20, 20, -halfSize - 20);
    
    // Resetar a rotação da câmera
    cameraRotation.x = -0.3; // Olhar um pouco para baixo
    cameraRotation.y = Math.PI / 4; // Olhar em direção à cidade
    
    // Aplicar a rotação
    camera.quaternion.setFromEuler(
        new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
    );

    switchToFirstPersonMode();
    adjustCameraToTerrain();
}

function createStreets(gridSize, blockSize, streetWidth, halfSize) {
    const streetMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });

    const heightOffset = 0.15;

    // Ruas horizontais (X)
    for (let i = 0; i <= gridSize; i++) {
        const posZ = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
        const startX = -halfSize;
        const endX = halfSize;

        if (heightData) {
            const curve = createRoadLine(startX, posZ, endX, posZ, 40, heightOffset);
            const geometry = createRoadGeometry(curve, streetWidth);
            const mesh = new THREE.Mesh(geometry, streetMaterial);
            mesh.receiveShadow = true;
            scene.add(mesh);
            cityObjects.push(mesh);
        } else {
            const width = endX - startX;
            const geometry = new THREE.PlaneGeometry(width, streetWidth);
            geometry.rotateX(-Math.PI / 2);
            const mesh = new THREE.Mesh(geometry, streetMaterial);
            mesh.position.set((startX + endX) / 2, heightOffset, posZ);
            mesh.receiveShadow = true;
            scene.add(mesh);
            cityObjects.push(mesh);
        }
    }

    // Ruas verticais (Z)
    for (let i = 0; i <= gridSize; i++) {
        const posX = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
        const startZ = -halfSize;
        const endZ = halfSize;

        if (heightData) {
            const curve = createRoadLine(posX, startZ, posX, endZ, 40, heightOffset);
            const geometry = createRoadGeometry(curve, streetWidth);
            const mesh = new THREE.Mesh(geometry, streetMaterial);
            mesh.receiveShadow = true;
            scene.add(mesh);
            cityObjects.push(mesh);
        } else {
            const length = endZ - startZ;
            const geometry = new THREE.PlaneGeometry(length, streetWidth);
            geometry.rotateX(-Math.PI / 2);
            const mesh = new THREE.Mesh(geometry, streetMaterial);
            mesh.position.set(posX, heightOffset, (startZ + endZ) / 2);
            mesh.rotation.y = Math.PI / 2; // Rotaciona para alinhar com eixo Z
            mesh.receiveShadow = true;
            scene.add(mesh);
            cityObjects.push(mesh);
        }
    }

    // Adicionar postes nas esquinas
    addStreetLampsAtCorners(gridSize, blockSize, streetWidth, halfSize);
}

// Criar linha 3D que segue o terreno
function createRoadLine(x1, z1, x2, z2, segments, heightOffset) {
    const points = [];
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t;
        const z = z1 + (z2 - z1) * t;
        
        // Obter altura do terreno neste ponto
        let y = 0;
        if (heightData) {
            y = getTerrainHeight(x, z) + heightOffset;
        } else {
            y = heightOffset;
        }
        
        points.push(new THREE.Vector3(x, y, z));
    }
    
    return new THREE.CatmullRomCurve3(points);
}

function createRoadGeometry(curve, width) {
    // Se não há elevação (terreno plano), usar PlaneGeometry simples
    if (!heightData) {
        const start = curve.getPoint(0);
        const end = curve.getPoint(1);

        const length = start.distanceTo(end);
        const geometry = new THREE.PlaneGeometry(length, width);
        geometry.rotateX(-Math.PI / 2);

        // Calcular posição central da rua para colocação correta
        const mid = start.clone().lerp(end, 0.5);
        geometry.translate(0, 0, 0); // já está centrada

        geometry.userData = {
            isFlat: true,
            position: mid,
            rotation: Math.atan2(end.z - start.z, end.x - start.x)
        };

        return geometry;
    }

    // Número de segmentos ao longo da rua e na largura
    const lengthSegments = 40;
    const widthSegments = 8;
    const halfWidth = width / 2;

    // Criar geometria de buffer para a malha adaptativa
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const uvs = [];

    // Criar vértices ao longo da rua e na largura
    for (let i = 0; i <= lengthSegments; i++) {
        const t = i / lengthSegments;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        
        // Calcular vetor perpendicular à tangente (normal à direção da rua)
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        
        for (let j = 0; j <= widthSegments; j++) {
            const w = (j / widthSegments) * 2 - 1; // -1 a 1
            const offset = normal.clone().multiplyScalar(w * halfWidth);
            
            // Calcular posição do vértice
            const vertexX = point.x + offset.x;
            const vertexZ = point.z + offset.z;
            
            // Obter altura do terreno neste ponto
            const height = getTerrainHeight(vertexX, vertexZ) + 0.15; // Pequeno offset para evitar z-fighting
            
            // Adicionar vértice
            vertices.push(vertexX, height, vertexZ);
            
            // Adicionar coordenadas UV
            uvs.push(i / lengthSegments, j / widthSegments);
        }
    }

    // Criar índices para os triângulos
    for (let i = 0; i < lengthSegments; i++) {
        for (let j = 0; j < widthSegments; j++) {
            const a = i * (widthSegments + 1) + j;
            const b = a + 1;
            const c = (i + 1) * (widthSegments + 1) + j;
            const d = c + 1;

            // Primeiro triângulo
            indices.push(a, b, c);
            // Segundo triângulo
            indices.push(b, d, c);
        }
    }

    // Configurar atributos da geometria
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
}

// Criar um bloco da cidade (3x3 edifícios)
function createCityBlock(centerX, centerZ, buildingSize, maxHeight) {
    const buildingsPerBlock = 3;
    
    // Configurações de variabilidade
    const buildingVariability = {
        minSpacing: buildingSize * 0.05,    // Espaçamento mínimo entre edifícios
        maxSpacing: buildingSize * 0.25,    // Espaçamento máximo entre edifícios
        minSizeRatio: 0.6,                  // Razão mínima de tamanho (em relação ao buildingSize)
        maxSizeRatio: 0.8,                  // Razão máxima de tamanho
        positionVariation: buildingSize * 0.15  // Variação máxima na posição
    };
    
    // Vamos criar um grid de posições base para os edifícios
    const positionsGrid = [];
    
    // Calcular espaçamento médio para determinar o quarteirão
    // const avgSpacing = (buildingVariability.minSpacing + buildingVariability.maxSpacing) / 2;
    const halfBlock = buildingSize * (buildingsPerBlock - 1) / 2;
    
    // Gerar posições base em grade
    for (let i = 0; i < buildingsPerBlock; i++) {
        for (let j = 0; j < buildingsPerBlock; j++) {
            // Posição base no grid
            const baseX = centerX - halfBlock + i * buildingSize;
            const baseZ = centerZ - halfBlock + j * buildingSize;
            
            // Adicionar variação aleatória às posições (evitar alinhamento perfeito)
            const offsetX = (Math.random() * 2 - 1) * buildingVariability.positionVariation;
            const offsetZ = (Math.random() * 2 - 1) * buildingVariability.positionVariation;
            
            // Posição final com variação
            const x = baseX + offsetX;
            const z = baseZ + offsetZ;
            
            // Tamanho variável para cada edifício
            const sizeRatio = buildingVariability.minSizeRatio + 
                             Math.random() * (buildingVariability.maxSizeRatio - buildingVariability.minSizeRatio);
            const actualSize = buildingSize * sizeRatio;
            
            // Altura variável
            const height = 5 + Math.random() * (maxHeight - 5);
            
            // Cor variável
            const color = new THREE.Color(
                0.5 + Math.random() * 0.2,
                0.5 + Math.random() * 0.2,
                0.6 + Math.random() * 0.3
            );
            
            // Verificar se não há sobreposição de edifícios
            const tooClose = positionsGrid.some(building => {
                const dx = x - building.x;
                const dz = z - building.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                const minDistance = (actualSize + building.size) / 2 + buildingVariability.minSpacing;
                return distance < minDistance;
            });
            
            // Se o edifício está muito próximo de outro, não o adicionamos
            if (!tooClose) {
                positionsGrid.push({ x, z, size: actualSize, height, color });
            }
        }
    }
    
    // Criar edifícios baseados nas posições geradas
    positionsGrid.forEach(building => {
        createBuilding(building.x, building.z, building.size, building.height, building.color);
    });
    
    // Se quisermos, podemos adicionar uma borda visual ao redor do quarteirão
    // const borderSize = buildingSize * buildingsPerBlock + avgSpacing * (buildingsPerBlock - 1);
    // const borderGeometry = new THREE.PlaneGeometry(borderSize, borderSize);
    // const borderMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    // const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
    // borderMesh.position.set(centerX, 0.02, centerZ);
    // borderMesh.rotation.x = -Math.PI / 2;
    // borderMesh.receiveShadow = true;
    // scene.add(borderMesh);
    // cityObjects.push(borderMesh);
}

// Adicionar padrão mais complexo para edifícios de escritório
function addOfficeWindowPattern(building, size, height) {
    // Número de andares e janelas por andar
    const floors = Math.floor(height / 2.5);
    const windowsPerFloor = 6;
    
    // Tamanho das janelas
    const windowWidth = size / (windowsPerFloor + 1);
    const windowHeight = 1.5;
    const windowDepth = 0.05;
    
    // Material para janelas
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.3, 
        metalness: 0.8,
        transparent: true,
        opacity: 0.7
    });
    
    // Material para os segmentos entre janelas
    const dividerMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888, 
        roughness: 0.5, 
        metalness: 0.6
    });
    
    // Adicionar janelas a cada lado
    const sides = [
        [0, 0, size/2 + 0.01, 0],             // frente
        [0, 0, -size/2 - 0.01, Math.PI],      // trás
        [size/2 + 0.01, 0, 0, Math.PI/2],     // direita
        [-size/2 - 0.01, 0, 0, -Math.PI/2]    // esquerda
    ];
    
    sides.forEach(([x, _, z, rotY]) => {
        // Para cada andar
        for (let floor = 0; floor < floors; floor++) {
            const floorY = (floor * 2.5) + 1.2 - height/2;
            
            // Adicionar linha de janelas
            for (let w = 0; w < windowsPerFloor; w++) {
                const windowX = (w - windowsPerFloor/2 + 0.5) * (windowWidth * 1.1);
                
                // Calcular posição final com base no lado
                let finalX = x;
                let finalY = floorY;
                let finalZ = z;
                
                if (Math.abs(x) < 0.1) { // frente ou trás
                    finalX = windowX;
                } else { // lados
                    finalZ = windowX;
                }
                
                // Geometria da janela (mais profunda para escritórios)
                const windowGeometry = new THREE.BoxGeometry(
                    windowWidth * 0.9, 
                    windowHeight, 
                    windowDepth * 2
                );
                
                const window = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                window.position.set(finalX, finalY, finalZ);
                window.rotation.y = rotY;
                
                // Variação nas janelas
                if (Math.random() > 0.7) {
                    window.material.color.setRGB(
                        0.2 + Math.random() * 0.2,
                        0.2 + Math.random() * 0.2,
                        0.3 + Math.random() * 0.3
                    );
                }
                
                // Janelas iluminadas (algumas)
                if (Math.random() > 0.7) {
                    window.material.emissive.set(0xFFDD99);
                    window.material.emissiveIntensity = 0.3;
                }
                
                building.add(window);
            }
            
            // Adicionar divisor de andar (banda horizontal)
            if (Math.abs(x) < 0.1) { // apenas para frente e trás
                const dividerGeometry = new THREE.BoxGeometry(
                    size, 
                    0.2, 
                    windowDepth
                );
                
                const divider = new THREE.Mesh(dividerGeometry, dividerMaterial);
                divider.position.set(0, floorY - windowHeight/2 - 0.1, z);
                divider.rotation.y = rotY;
                
                building.add(divider);
            }
        }
    });
}

// Inicializar contador para gerar estilos de edifícios com certa distribuição
let buildingTypeCounter = 0;

// Configurações de LOD
const LOD_DISTANCES = {
    HIGH: 50,    // Distância para detalhes altos
    MEDIUM: 100, // Distância para detalhes médios
    LOW: 200     // Distância para detalhes baixos
};

// Configurações de Fog
const FOG_SETTINGS = {
    color: 0xcccccc,
    near: 50,
    far: 200
};

// Função auxiliar para encontrar a malha principal de um objeto
function getMainMesh(object) {
    let mesh = null;
    object.traverse(child => {
        if (child.isMesh && !mesh) {
            mesh = child;
        }
    });
    return mesh;
}

// Criar um edifício com design variado e LOD
function createBuilding(x, z, size, height, color) {
    // Obter altura do terreno na posição do edifício
    const terrainHeight = getTerrainHeight(x, z);
    
    // Grupo para conter todas as partes do edifício
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(x, terrainHeight, z);
    
    // Criar fundação que se estende abaixo do terreno
    const foundationHeight = 10; // Altura da fundação abaixo do terreno
    const foundationGeometry = new THREE.BoxGeometry(size * 1.1, foundationHeight, size * 1.1);
    const foundationMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });
    const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
    foundation.position.set(0, -foundationHeight/2, 0);
    foundation.castShadow = true;
    foundation.receiveShadow = true;
    buildingGroup.add(foundation);
    
    // Determinar o tipo de edifício
    buildingTypeCounter = (buildingTypeCounter + 1) % 6;
    let buildingType;
    
    if (height > 15) {
        const rnd = Math.random();
        if (rnd < 0.6) {
            buildingType = "skyscraper";
        } else if (rnd < 0.8) {
            buildingType = "modern";
        } else {
            buildingType = "landmark";
        }
    } else if (height < 8) {
        const rnd = Math.random();
        if (rnd < 0.5) {
            buildingType = "residential";
        } else if (rnd < 0.8) {
            buildingType = "industrial";
        } else {
            buildingType = "office";
        }
    } else {
        const types = ["modern", "skyscraper", "residential", "office", "industrial", "landmark"];
        buildingType = types[buildingTypeCounter];
    }
    
    // Criar versões LOD do edifício
    const lod = new THREE.LOD();
    
    // Versão de alta qualidade (próxima)
    const highDetail = new THREE.Group();
    switch (buildingType) {
        case "modern":
            createModernBuilding(highDetail, size, height, color);
            break;
        case "skyscraper":
            createSkyscraper(highDetail, size, height, color);
            break;
        case "residential":
            createResidentialBuilding(highDetail, size, height, color);
            break;
        case "office":
            createOfficeBuilding(highDetail, size, height, color);
            break;
        case "industrial":
            createIndustrialBuilding(highDetail, size, height, color);
            break;
        case "landmark":
            createLandmarkBuilding(highDetail, size, height, color);
            break;
        default:
            createSimpleBuilding(highDetail, size, height, color);
    }
    lod.addLevel(highDetail, 0);
    
    // Versão de média qualidade - preservar forma básica
    const mediumDetail = new THREE.Group();
    switch (buildingType) {
        case "landmark":
            // Para landmarks, preservar a forma básica (cone, cilindro, etc)
            const baseShape = highDetail.userData.baseShape || 0;
            createLandmarkBuilding(mediumDetail, size, height, color, baseShape, true);
            break;
        default:
            createSimpleBuilding(mediumDetail, size, height, color);
            addWindowGrid(mediumDetail.children[0], size, height, color, 0.5);
    }
    lod.addLevel(mediumDetail, LOD_DISTANCES.HIGH);
    
    // Versão de baixa qualidade - preservar forma básica
    const lowDetail = new THREE.Group();
    switch (buildingType) {
        case "landmark":
            // Para landmarks, preservar a forma básica
            createLandmarkBuilding(lowDetail, size, height, color, highDetail.userData.baseShape || 0, true);
            break;
        default:
            createSimpleBuilding(lowDetail, size, height, color);
    }
    lod.addLevel(lowDetail, LOD_DISTANCES.MEDIUM);
    
    buildingGroup.add(lod);
    
    // Configurar sombras apenas para o nível de detalhe atual
    lod.traverse((object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });
    
    // Adicionar à cena e à lista de objetos da cidade
    scene.add(buildingGroup);
    cityObjects.push(buildingGroup);
    
    // Adicionar bounding box para colisão
    let bbox;
    if (buildingType === "industrial") {
        // Para edifícios industriais, usar apenas a malha principal
        const mainMesh = getMainMesh(buildingGroup);
        if (mainMesh) {
            bbox = new THREE.Box3().setFromObject(mainMesh).expandByScalar(0.1);
        }
    } else {
        // Para outros tipos de edifícios, usar o grupo inteiro
        bbox = new THREE.Box3().setFromObject(buildingGroup).expandByScalar(0.1);
    }
    
    if (bbox) {
        buildingBoxes.push(bbox);
        
        // Adicionar visualização da bounding box se debug estiver ativado
        if (window.DEBUG_COLLISIONS) {
            const helper = new THREE.Box3Helper(bbox, 0xff0000);
            scene.add(helper);
        }
    }
    
    // Ao adicionar cada parte do edifício, garantir que as sombras estejam ativadas
    buildingGroup.children.forEach(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    return buildingGroup;
}

// Edifício simples (caixa básica)
function createSimpleBuilding(group, size, height, color) {
    const geometry = new THREE.BoxGeometry(size, height, size);
    const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
    
    const building = new THREE.Mesh(geometry, material);
    building.position.set(0, height / 2, 0);
    
    group.add(building);
}

// Edifício moderno com vidros
function createModernBuilding(group, size, height, color) {
    // Corpo principal do edifício
    const mainGeometry = new THREE.BoxGeometry(size, height, size);
    
    // Material principal - vidro azulado
    const glassColor = new THREE.Color(0.6, 0.8, 0.9);
    const glassMaterial = new THREE.MeshStandardMaterial({ 
        color: glassColor, 
        roughness: 0.1, 
        metalness: 0.8,
        transparent: false,
        // opacity: 0.7
    });
    
    // Material para estrutura
    const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: color,
        
    });
    
    // Principais materiais
    const materials = [
        frameMaterial, // direita
        frameMaterial, // esquerda
        frameMaterial, // topo
        frameMaterial, // base
        frameMaterial, // frente
        frameMaterial  // trás
    ];
    
    // Criar malha principal com materiais múltiplos
    const building = new THREE.Mesh(mainGeometry, materials);
    building.position.set(0, height / 2, 0);
    
    // Adicionar detalhes ao edifício
    addWindowGrid(building, size, height, color);
    
    group.add(building);
}

// Arranha-céu com topo estilizado
function createSkyscraper(group, size, height, color) {
    // Corpo principal (90% da altura)
    const mainHeight = height * 0.9;
    const mainGeometry = new THREE.BoxGeometry(size, mainHeight, size);
    const mainMaterial = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.5, 
        metalness: 0.3 
    });
    
    const mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
    mainBuilding.position.set(0, mainHeight / 2, 0);
    
    // Topo estilizado (10% da altura restante + extra)
    const topSize = size * 0.7;
    const topHeight = height * 0.15;
    const topGeometry = new THREE.CylinderGeometry(topSize/2, topSize/2, topHeight, 8);
    
    // Material metálico para o topo
    const topMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xCCCCCC, 
        roughness: 0.3, 
        metalness: 0.8 
    });
    
    const topPart = new THREE.Mesh(topGeometry, topMaterial);
    topPart.position.set(0, mainHeight + topHeight/2, 0);
    
    // Antena ou spire (opcional)
    if (Math.random() > 0.5) {
        const spireHeight = height * 0.2;
        const spireGeometry = new THREE.CylinderGeometry(size/30, size/20, spireHeight, 8);
        const spireMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x888888, 
            roughness: 0.3, 
            metalness: 0.9 
        });
        
        const spire = new THREE.Mesh(spireGeometry, spireMaterial);
        spire.position.set(0, mainHeight + topHeight + spireHeight/2, 0);
        
        group.add(spire);
    }
    
    // Adicionar detalhes de janelas
    addWindowGrid(mainBuilding, size, mainHeight, color);
    
    group.add(mainBuilding);
    group.add(topPart);
}

// Edifício residencial com varandas
function createResidentialBuilding(group, size, height, color) {
    // Corpo principal
    const mainGeometry = new THREE.BoxGeometry(size, height, size);
    const mainMaterial = new THREE.MeshStandardMaterial({ 
        color: color, 
        roughness: 0.8, 
        metalness: 0.1 
    });
    
    const building = new THREE.Mesh(mainGeometry, mainMaterial);
    building.position.set(0, height / 2, 0);
    
    // Adicionar varandas
    const floors = Math.floor(height / 3);
    const balconyDepth = size * 0.15;
    const balconyWidth = size * 0.3;
    const balconyHeight = 0.2;
    
    const balconyGeometry = new THREE.BoxGeometry(balconyWidth, balconyHeight, balconyDepth);
    const balconyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF, 
        roughness: 0.9, 
        metalness: 0.1 
    });
    
    // Posições das varandas (frente, trás, esquerda, direita)
    const positions = [
        [0, 0, size/2 + balconyDepth/2],                // frente
        [0, 0, -(size/2 + balconyDepth/2)],             // trás
        [size/2 + balconyDepth/2, 0, 0],                // direita
        [-(size/2 + balconyDepth/2), 0, 0]              // esquerda
    ];
    
    // Adicionar varandas em posições aleatórias
    for (let floor = 1; floor < floors; floor++) {
        const floorY = (floor * height / floors) - (height / floors / 2);
        
        // Escolher aleatoriamente qual lado terá varanda neste andar
        const sides = Math.floor(Math.random() * 4) + 1; // 1-4 lados
        const usedPositions = [];
        
        for (let i = 0; i < sides; i++) {
            let posIndex;
            do {
                posIndex = Math.floor(Math.random() * positions.length);
            } while (usedPositions.includes(posIndex));
            
            usedPositions.push(posIndex);
            
            const [x, _, z] = positions[posIndex];
            
            const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
            balcony.position.set(x, floorY, z);
            
            // Rotacionar as varandas laterais para alinhar corretamente
            if (posIndex === 2 || posIndex === 3) {
                balcony.rotation.y = Math.PI / 2;
            }
            
            group.add(balcony);
        }
    }
    
    // Adicionar padrão de janelas
    addWindowGrid(building, size, height, color);
    
    group.add(building);
}

// Edifício de escritório com padrão de janelas
function createOfficeBuilding(group, size, height, color) {
    // Corpo principal
    const mainGeometry = new THREE.BoxGeometry(size, height, size);
    
    // Cor base mais escura para o edifício
    const baseColor = new THREE.Color(color);
    baseColor.multiplyScalar(0.8); // Escurecer um pouco
    
    const mainMaterial = new THREE.MeshStandardMaterial({ 
        color: baseColor, 
        roughness: 0.6, 
        metalness: 0.3 
    });
    
    const building = new THREE.Mesh(mainGeometry, mainMaterial);
    building.position.set(0, height / 2, 0);
    
    // Adicionar padrão mais complexo de janelas
    addOfficeWindowPattern(building, size, height);
    
    group.add(building);
}

// Edifício industrial
function createIndustrialBuilding(group, size, height, color) {
    // Altura mais baixa em média para edifícios industriais
    height = Math.min(height, 10);
    
    // Corpo principal
    const mainGeometry = new THREE.BoxGeometry(size * 1.2, height, size * 1.2);
    
    // Cor industrial (mais cinza)
    const industrialColor = new THREE.Color(
        color.r * 0.7,
        color.g * 0.7,
        color.b * 0.7
    );
    
    const mainMaterial = new THREE.MeshStandardMaterial({ 
        color: industrialColor, 
        roughness: 0.9, 
        metalness: 0.2 
    });
    
    const building = new THREE.Mesh(mainGeometry, mainMaterial);
    building.position.set(0, height / 2, 0);
    
    // Adicionar telhado inclinado
    const roofHeight = height * 0.3;
    const roofGeometry = new THREE.ConeGeometry(size * 0.9, roofHeight, 4);
    
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.8, 
        metalness: 0.2 
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, height + roofHeight/2, 0);
    roof.rotation.y = Math.PI / 4; // Rotacionar 45 graus
    
    // Ocasionalmente adicionar uma chaminé
    if (Math.random() > 0.6) {
        const chimneyHeight = height * 0.6;
        const chimneyRadius = size * 0.1;
        const chimneyGeometry = new THREE.CylinderGeometry(
            chimneyRadius, chimneyRadius, chimneyHeight, 8
        );
        
        const chimneyMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x993333, 
            roughness: 0.9, 
            metalness: 0.1 
        });
        
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        
        // Posicionar na lateral do edifício
        chimney.position.set(
            size * 0.4,
            height + chimneyHeight/2,
            size * 0.4
        );
        
        group.add(chimney);
    }
    
    group.add(building);
    group.add(roof);
}

// Edifício icônico (landmark)
function createLandmarkBuilding(group, size, height, color, baseShape = null, isLowDetail = false) {
    // Landmarks são mais altos em média
    height = Math.max(height, 15);
    
    // Escolher uma forma base aleatória se não for especificada
    if (baseShape === null) {
        baseShape = Math.floor(Math.random() * 5);
        group.userData.baseShape = baseShape; // Armazenar para uso em LODs
    }
    
    // Cor mais vívida para landmarks
    const landmarkColor = new THREE.Color(
        Math.max(0.6, color.r * 1.2),
        Math.max(0.6, color.g * 1.2),
        Math.max(0.6, color.b * 1.2)
    );
    
    const mainMaterial = new THREE.MeshStandardMaterial({ 
        color: landmarkColor, 
        roughness: 0.5, 
        metalness: 0.4 
    });
    
    let mainBuilding;
    
    switch (baseShape) {
        case 0: // Forma cônica
            const coneGeometry = new THREE.ConeGeometry(size/2, height, isLowDetail ? 4 : 6);
            mainBuilding = new THREE.Mesh(coneGeometry, mainMaterial);
            mainBuilding.position.set(0, height / 2, 0);
            break;
            
        case 1: // Forma cilíndrica
            const cylinderGeometry = new THREE.CylinderGeometry(size/2, size/2, height, isLowDetail ? 8 : 16);
            mainBuilding = new THREE.Mesh(cylinderGeometry, mainMaterial);
            mainBuilding.position.set(0, height / 2, 0);
            break;
            
        case 2: // Forma piramidal
            const pyramidGeometry = new THREE.ConeGeometry(size/2, height, 4);
            mainBuilding = new THREE.Mesh(pyramidGeometry, mainMaterial);
            mainBuilding.position.set(0, height / 2, 0);
            break;
            
        case 3: // Edifício curvo
            if (!isLowDetail) {
                const curveShape = new THREE.Shape();
                curveShape.moveTo(-size/2, -size/2);
                curveShape.quadraticCurveTo(size/2, -size, size/2, size/2);
                curveShape.lineTo(-size/2, size/2);
                curveShape.lineTo(-size/2, -size/2);
                
                const extrudeSettings = {
                    steps: 1,
                    depth: height,
                    bevelEnabled: false
                };
                
                const curveGeometry = new THREE.ExtrudeGeometry(curveShape, extrudeSettings);
                curveGeometry.rotateX(-Math.PI / 2);
                
                mainBuilding = new THREE.Mesh(curveGeometry, mainMaterial);
                mainBuilding.position.set(0, 0, 0);
            } else {
                // Versão simplificada para LOD baixo
                const boxGeometry = new THREE.BoxGeometry(size, height, size);
                mainBuilding = new THREE.Mesh(boxGeometry, mainMaterial);
                mainBuilding.position.set(0, height / 2, 0);
            }
            break;
            
        case 4: // Edifício com vários segmentos
            if (!isLowDetail) {
                const segments = Math.floor(Math.random() * 3) + 3;
                for (let i = 0; i < segments; i++) {
                    const segmentSize = size * (1 - (i * 0.2));
                    const segmentHeight = height / segments;
                    const segmentGeometry = new THREE.BoxGeometry(
                        segmentSize, 
                        segmentHeight, 
                        segmentSize
                    );
                    
                    const segment = new THREE.Mesh(segmentGeometry, mainMaterial.clone());
                    const hue = (i / segments) * 0.1;
                    segment.material.color.offsetHSL(hue, 0, 0);
                    segment.position.set(0, (i * segmentHeight) + segmentHeight/2, 0);
                    group.add(segment);
                }
                return;
            } else {
                // Versão simplificada para LOD baixo
                const boxGeometry = new THREE.BoxGeometry(size, height, size);
                mainBuilding = new THREE.Mesh(boxGeometry, mainMaterial);
                mainBuilding.position.set(0, height / 2, 0);
            }
            break;
            
        default:
            const boxGeometry = new THREE.BoxGeometry(size, height, size);
            mainBuilding = new THREE.Mesh(boxGeometry, mainMaterial);
            mainBuilding.position.set(0, height / 2, 0);
    }
    
    if (mainBuilding) {
        group.add(mainBuilding);
    }
}

// Modificar a função addWindowGrid para aceitar um parâmetro de densidade
function addWindowGrid(building, size, height, color, density = 1.0) {
    const windowSize = size * 0.1;
    const windowDepth = size * 0.02;
    const floors = Math.floor(height / 3);
    const windowsPerSide = Math.max(2, Math.floor(3 * density)); // Reduzir número de janelas com densidade
    
    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, windowDepth);
    
    // Material escuro para janelas
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.3, 
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
    
    // Adicionar janelas a cada lado
    const sides = [
        [0, 0, size/2 + windowDepth/2],  // frente
        [0, 0, -size/2 - windowDepth/2], // trás
        [size/2 + windowDepth/2, 0, 0],  // direita
        [-size/2 - windowDepth/2, 0, 0]  // esquerda
    ];
    
    sides.forEach((sidePosition, sideIndex) => {
        for (let floor = 0; floor < floors; floor++) {
            const floorY = (floor * height / floors) + (height / floors / 2) - height/2 + 1;
            
            for (let wx = 0; wx < windowsPerSide; wx++) {
                for (let wy = 0; wy < windowsPerSide; wy++) {
                    // Apenas criar janelas com probabilidade baseada na densidade
                    if (Math.random() > (1 - density)) {
                        let xPos = (wx + 1) * (size / (windowsPerSide + 1)) - size/2;
                        let yPos = floorY;
                        let zPos = (wy + 1) * (size / (windowsPerSide + 1)) - size/2;
                        
                        // Ajustar a posição com base no lado
                        let finalX, finalY, finalZ;
                        let rotationY = 0;
                        
                        switch (sideIndex) {
                            case 0: // frente
                                finalX = xPos;
                                finalY = yPos;
                                finalZ = size/2 + windowDepth/2;
                                break;
                            case 1: // trás
                                finalX = -xPos;
                                finalY = yPos;
                                finalZ = -size/2 - windowDepth/2;
                                rotationY = Math.PI;
                                break;
                            case 2: // direita
                                finalX = size/2 + windowDepth/2;
                                finalY = yPos;
                                finalZ = -zPos;
                                rotationY = Math.PI / 2;
                                break;
                            case 3: // esquerda
                                finalX = -size/2 - windowDepth/2;
                                finalY = yPos;
                                finalZ = zPos;
                                rotationY = -Math.PI / 2;
                                break;
                        }
                        
                        const window = new THREE.Mesh(windowGeometry, windowMaterial);
                        window.position.set(finalX, finalY, finalZ);
                        window.rotation.y = rotationY;
                        
                        // Iluminar aleatoriamente algumas janelas
                        if (Math.random() > 0.7) {
                            const lightMaterial = windowMaterial.clone();
                            lightMaterial.color.set(0xFFDD99);
                            lightMaterial.emissive.set(0xFFDD99);
                            lightMaterial.emissiveIntensity = 0.5;
                            window.material = lightMaterial;
                        }
                        
                        building.add(window);
                    }
                }
            }
        }
    });
}

// Adicionar padrão de vidros para edifícios modernos
function addGlassPatterns(building, size, height) {
    const panelWidth = size / 5;
    const floors = Math.floor(height / 2);
    
    const glassGeometry = new THREE.PlaneGeometry(panelWidth, 1.8);
    
    // Material para os painéis de vidro
    const glassMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x88CCFF, 
        roughness: 0.1, 
        metalness: 0.9,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    
    // Material para molduras
    const frameMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333, 
        roughness: 0.5, 
        metalness: 0.8 
    });
    
    // Adicionar painéis a cada lado
    const sides = [
        [0, 0, size/2 + 0.01, 0],             // frente
        [0, 0, -size/2 - 0.01, Math.PI],      // trás
        [size/2 + 0.01, 0, 0, Math.PI/2],     // direita
        [-size/2 - 0.01, 0, 0, -Math.PI/2]    // esquerda
    ];
    
    sides.forEach(([x, _, z, rotY]) => {
        for (let floor = 0; floor < floors; floor++) {
            const floorY = (floor * 2) + 1 - height/2;
            
            for (let panel = 0; panel < 5; panel++) {
                const panelX = (panel - 2) * panelWidth;
                
                // Calcular posição final com base no lado
                let finalX = x;
                let finalY = floorY;
                let finalZ = z;
                
                if (Math.abs(x) < 0.1) { // frente ou trás
                    finalX = panelX;
                } else { // lados
                    finalZ = panelX;
                }
                
                const glass = new THREE.Mesh(glassGeometry, glassMaterial.clone());
                glass.position.set(finalX, finalY, finalZ);
                glass.rotation.y = rotY;
                
                // Variar um pouco a transparência e cor para efeito visual
                glass.material.opacity = 0.4 + Math.random() * 0.4;
                
                // Ocasionalmente adicionar reflexos mais fortes
                if (Math.random() > 0.7) {
                    glass.material.color.set(0x99DDFF);
                    glass.material.metalness = 1.0;
                }
                
                building.add(glass);
                
                // Adicionar molduras horizontais entre andares
                if (panel === 0) {
                    const frameGeometry = new THREE.BoxGeometry(size + 0.1, 0.1, 0.05);
                    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
                    
                    frame.position.set(0, floorY - 1, z);
                    
                    if (Math.abs(x) > 0.1) { // lados
                        frame.rotation.y = Math.PI/2;
                    }
                    
                    building.add(frame);
                }
            }
        }
    });
}

// Adicionar função para atualizar LODs baseado na distância da câmera
function updateBuildingLODs() {
    cityObjects.forEach(building => {
        const distance = camera.position.distanceTo(building.position);
        const lod = building.children[0]; // Assumindo que o LOD é o primeiro filho
        
        if (distance < LOD_DISTANCES.HIGH) {
            lod.levels[0].visible = true;
            lod.levels[1].visible = false;
            lod.levels[2].visible = false;
        } else if (distance < LOD_DISTANCES.MEDIUM) {
            lod.levels[0].visible = false;
            lod.levels[1].visible = true;
            lod.levels[2].visible = false;
        } else {
            lod.levels[0].visible = false;
            lod.levels[1].visible = false;
            lod.levels[2].visible = true;
        }
    });
}

// Modificar o loop de animação para incluir a atualização de LODs
function animate() {
    requestAnimationFrame(animate);
    
    // Atualizar LODs baseado na distância da câmera
    updateBuildingLODs();
    
    // ... resto do código de animação existente ...
}

// Limpar a cidade
function clearCity() {
    cityObjects.forEach(obj => {
        scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(mat => mat.dispose());
            } else {
                obj.material.dispose();
            }
        }
    });
    
    // Limpar helpers de debug
    scene.children.forEach(child => {
        if (child.isBox3Helper) {
            scene.remove(child);
        }
    });
    
    cityObjects = [];
    buildingBoxes = []; // Limpar as bounding boxes dos edifícios
    clearTrees(); // Limpar árvores
    clearParks(); // Limpar parques
    clearWaterBodies(); // Limpar lagos
    clearStreetLamps(); // Limpar postes de luz
}

// Modificar a função switchToFirstPersonMode para adicionar fog
function switchToFirstPersonMode() {
    // Se estiver no modo aéreo, voltar para a posição salva
    if (cameraViews.currentMode === cameraViews.modes.AERIAL) {
        camera.position.copy(cameraViews.savedView.position);
        cameraRotation.x = cameraViews.savedView.rotation.x;
        cameraRotation.y = cameraViews.savedView.rotation.y;
        
        camera.quaternion.setFromEuler(
            new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
        );
    }
    
    // Ajustar a altura da câmera para ficar no nível do chão
    if (heightData) {
        const terrainY = getTerrainHeight(camera.position.x, camera.position.z);
        camera.position.y = terrainY + 2; // 2 unidades acima do terreno
    } else {
        camera.position.y = 2; // 2 unidades acima do chão plano
    }
    
    // Mudar para o modo primeira pessoa
    cameraViews.currentMode = cameraViews.modes.FIRST_PERSON;
    cameraViews.isAerialView = false;
    
    // Adicionar fog no modo primeira pessoa
    scene.fog = new THREE.Fog(FOG_SETTINGS.color, FOG_SETTINGS.near, FOG_SETTINGS.far);
    
    // Atualizar UI
    updateCameraButtonsUI();
}

// Modificar a função switchToFlyMode para manter o fog
function switchToFlyMode() {
    // Se estiver no modo aéreo, salvar aquela posição também
    if (cameraViews.currentMode === cameraViews.modes.AERIAL) {
        saveCurrentCameraState();
    }
    
    // Mudar para o modo de voo
    cameraViews.currentMode = cameraViews.modes.FLY;
    cameraViews.isAerialView = false;
    
    // Adicionar fog no modo de voo também
    scene.fog = new THREE.Fog(FOG_SETTINGS.color, FOG_SETTINGS.near, FOG_SETTINGS.far);
    
    // Atualizar UI
    updateCameraButtonsUI();
}

// Modificar a função switchToAerialView para remover fog e desativar LOD
function switchToAerialView() {
    // Salvar posição e rotação atuais
    saveCurrentCameraState();
    
    // Mudar para o modo aéreo
    cameraViews.currentMode = cameraViews.modes.AERIAL;
    cameraViews.isAerialView = true;
    
    // Remover fog na vista aérea
    scene.fog = null;
    
    // Descobrir o centro da cidade e a altura apropriada
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const streetWidth = parseInt(document.getElementById('streetWidth').value);
    const buildingSize = parseInt(document.getElementById('buildingSize').value);
    
    // Calcular tamanho total da cidade
    const blockSize = buildingSize * 3; // 3x3 edifícios por bloco
    const totalSize = (gridSize * blockSize) + ((gridSize + 1) * streetWidth);
    
    // Posicionar a câmera acima do centro da cidade
    const height = totalSize * 0.8; // Altura baseada no tamanho da cidade
    camera.position.set(0, height, 0);
    
    // Apontar a câmera para baixo
    cameraRotation.x = -Math.PI / 2; // Olhar diretamente para baixo
    cameraRotation.y = 0;
    
    camera.quaternion.setFromEuler(
        new THREE.Euler(cameraRotation.x, cameraRotation.y, 0, 'YXZ')
    );
    
    // Forçar a atualização do LOD para máxima qualidade
    updateBuildingLODsForAerialView();
    
    // Atualizar UI
    updateCameraButtonsUI();
    
    // Desabilitar o controle de pointerlock
    if (document.pointerLockElement) {
        document.exitPointerLock();
    }
}

// Modificar a função updateBuildingLODs para considerar o modo da câmera
function updateBuildingLODs() {
    // Se estiver no modo de vista aérea, usar sempre a maior qualidade
    if (cameraViews.currentMode === cameraViews.modes.AERIAL) {
        updateBuildingLODsForAerialView();
        return;
    }
    
    // Para modos de primeira pessoa e voo, usar LOD baseado na distância
    cityObjects.forEach(building => {
        const lod = building.children[0]; // Assumindo que o LOD é o primeiro filho
        if (lod && lod.isLOD) {
            const distance = camera.position.distanceTo(building.position);
            
            if (distance < LOD_DISTANCES.HIGH) {
                lod.levels[0].visible = true;
                lod.levels[1].visible = false;
                lod.levels[2].visible = false;
            } else if (distance < LOD_DISTANCES.MEDIUM) {
                lod.levels[0].visible = false;
                lod.levels[1].visible = true;
                lod.levels[2].visible = false;
            } else {
                lod.levels[0].visible = false;
                lod.levels[1].visible = false;
                lod.levels[2].visible = true;
            }
        }
    });
}

// Nova função para forçar alta qualidade na vista aérea
function updateBuildingLODsForAerialView() {
    cityObjects.forEach(building => {
        const lod = building.children[0]; // Assumindo que o LOD é o primeiro filho
        if (lod && lod.isLOD) {
            // Sempre usar a maior qualidade no modo aéreo
            lod.levels[0].visible = true;
            lod.levels[1].visible = false;
            lod.levels[2].visible = false;
        }
    });
}

// Modificar o loop de animação para incluir a verificação do modo atual
function animate() {
    requestAnimationFrame(animate);
    
    // Atualizar LODs baseado no modo atual da câmera
    updateBuildingLODs();
    
    // ... resto do código de animação existente ...
}