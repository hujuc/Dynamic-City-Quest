// Variáveis globais para corpos d'água
let waterBodies = [];
let waterSettings = {
    enabled: true,
    probability: 0.15  // Probabilidade de um bloco ser um lago (15%)
};

// Array para armazenar objetos de colisão das pedras
let stoneCollisionObjects = [];

// Criar um lago em uma posição específica
function createLake(centerX, centerZ, size) {
    const lakeGroup = new THREE.Group();
    
    // Cria um lago circular
    const lakeRadius = size * 0.4; // Raio do lago baseado no tamanho do bloco
    const resolution = 32; // Número de segmentos para suavidade
    
    // Criar a superfície da água que se adapta ao terreno
    createAdaptiveWaterSurface(lakeGroup, centerX, centerZ, lakeRadius, resolution);
    
    // Adicionar pedras decorativas ao redor do lago
    addStonesAroundLake(lakeGroup, centerX, centerZ, lakeRadius);
    
    // Posicionar o grupo do lago
    lakeGroup.position.set(centerX, 0, centerZ);
    
    // Adicionar à cena
    scene.add(lakeGroup);
    waterBodies.push(lakeGroup);
    cityObjects.push(lakeGroup);
    
    return lakeGroup;
}

// Criar uma superfície de água que se adapta ao terreno
function createAdaptiveWaterSurface(lakeGroup, centerX, centerZ, radius, segments) {
    // Material da água com efeito de transparência
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x3498db,      // Azul
        roughness: 0.0,       // Superfície lisa
        metalness: 0.5,       // Um pouco metálica para reflexão
        transparent: true,    // Transparente
        opacity: 0.8,         // 80% opaco
        side: THREE.DoubleSide // Renderiza ambos os lados para evitar problemas de visibilidade
    });
    
    // Se não temos terreno com relevo, criar lago plano simples
    if (!heightData) {
        const waterGeometry = new THREE.CircleGeometry(radius, segments);
        waterGeometry.rotateX(-Math.PI / 2);
        
        const waterSurface = new THREE.Mesh(waterGeometry, waterMaterial);
        waterSurface.position.set(0, 0.2, 0); // Ligeiramente acima do solo
        waterSurface.receiveShadow = true;
        lakeGroup.add(waterSurface);
        
        return waterSurface;
    }
    
    // Criar uma malha com pontos que seguem o terreno
    const points = [];
    const heightOffset = 0.3; // Altura da água acima do terreno
    
    // Criar pontos para a curva de contorno do lago
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const z = centerZ + Math.sin(angle) * radius;
        
        // Obter altura do terreno neste ponto
        const y = getTerrainHeight(x, z) + heightOffset;
        
        points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
    }
    
    // Fechar o ciclo
    points.push(points[0].clone());
    
    // Criar a forma circular do lago
    const lakeShape = new THREE.Shape();
    lakeShape.moveTo(0, 0);
    
    // Criar triângulos do centro para a borda para formar o lago
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        lakeShape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    
    lakeShape.closePath();
    
    // Criar uma malha de pontos internos do lago
    const lakeGeometry = new THREE.BufferGeometry();
    const lakeVertices = [];
    const lakeIndices = [];
    
    // Ponto central
    lakeVertices.push(0, getTerrainHeight(centerX, centerZ) + heightOffset, 0);
    
    // Pontos na borda
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Obter altura do terreno neste ponto
        const y = getTerrainHeight(centerX + x, centerZ + z) + heightOffset;
        
        lakeVertices.push(x, y, z);
    }
    
    // Criar triângulos (face para cada segmento)
    for (let i = 0; i < segments; i++) {
        lakeIndices.push(0, i + 1, ((i + 1) % segments) + 1);
    }
    
    lakeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lakeVertices, 3));
    lakeGeometry.setIndex(lakeIndices);
    lakeGeometry.computeVertexNormals();
    
    const lakeMesh = new THREE.Mesh(lakeGeometry, waterMaterial);
    lakeMesh.receiveShadow = true;
    
    lakeGroup.add(lakeMesh);
    
    // Criar as paredes do lago
    createAdaptiveLakeWalls(lakeGroup, centerX, centerZ, radius, segments, heightOffset);
    
    return lakeMesh;
}

// Criar paredes adaptativas para o lago
function createAdaptiveLakeWalls(lakeGroup, centerX, centerZ, radius, segments, heightOffset) {
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x3498db,      // Azul
        roughness: 0.0,
        metalness: 0.5,
        side: THREE.DoubleSide
    });
    
    // Criar uma geometria de faixa para as paredes
    const wallGeometry = new THREE.BufferGeometry();
    const wallVertices = [];
    const wallIndices = [];
    
    // A profundidade das paredes
    const wallDepth = 10;
    
    // Criar vértices para as paredes
    for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Obter altura do terreno neste ponto
        const y = getTerrainHeight(centerX + x, centerZ + z) + heightOffset;
        
        // Vértice superior (na superfície)
        wallVertices.push(x, y, z);
        
        // Vértice inferior (abaixo da superfície)
        wallVertices.push(x, y - wallDepth, z);
    }
    
    // Criar índices para os triângulos das paredes
    for (let i = 0; i < segments; i++) {
        const topLeft = i * 2;
        const bottomLeft = i * 2 + 1;
        const topRight = (i + 1) * 2;
        const bottomRight = (i + 1) * 2 + 1;
        
        // Primeiro triângulo (superior-esquerdo, inferior-esquerdo, superior-direito)
        wallIndices.push(topLeft, bottomLeft, topRight);
        
        // Segundo triângulo (inferior-esquerdo, inferior-direito, superior-direito)
        wallIndices.push(bottomLeft, bottomRight, topRight);
    }
    
    wallGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wallVertices, 3));
    wallGeometry.setIndex(wallIndices);
    wallGeometry.computeVertexNormals();
    
    const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
    wallMesh.receiveShadow = true;
    
    lakeGroup.add(wallMesh);
    
    return wallMesh;
}

// Criar base do lago (fundo)
function createLakeBottom(lakeGroup, centerX, centerZ, radius, segments, heightOffset) {
    const bottomMaterial = new THREE.MeshStandardMaterial({
        color: 0x2980b9,  // Azul escuro para o fundo
        roughness: 0.8,
        metalness: 0.1
    });
    
    // Profundidade do lago
    const lakeDepth = 1.5;
    
    // Criar geometria para o fundo do lago
    const bottomGeometry = new THREE.BufferGeometry();
    const bottomVertices = [];
    const bottomIndices = [];
    
    // Ponto central
    bottomVertices.push(0, getTerrainHeight(centerX, centerZ) + heightOffset - lakeDepth, 0);
    
    // Pontos na borda
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        // Obter altura do terreno neste ponto e subtrair a profundidade do lago
        const y = getTerrainHeight(centerX + x, centerZ + z) + heightOffset - lakeDepth;
        
        bottomVertices.push(x, y, z);
    }
    
    // Criar triângulos (face para cada segmento)
    for (let i = 0; i < segments; i++) {
        bottomIndices.push(0, i + 1, ((i + 1) % segments) + 1);
    }
    
    bottomGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bottomVertices, 3));
    bottomGeometry.setIndex(bottomIndices);
    bottomGeometry.computeVertexNormals();
    
    const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomMesh.receiveShadow = true;
    
    lakeGroup.add(bottomMesh);
    
    return bottomMesh;
}

// Função para adicionar pedras decorativas ao redor do lago
function addStonesAroundLake(lakeGroup, centerX, centerZ, radius) {
    // Configurações para as pedras
    const stoneSettings = {
        minSize: 0.3,          // Tamanho mínimo da pedra
        maxSize: 1.2,          // Tamanho máximo da pedra
        count: 25,             // Número de pedras a serem colocadas
        edgeVariation: 0.15,   // Variação da distância do centro do lago
        minDistance: 0.8,      // Distância mínima entre pedras (para evitar sobreposição)
        colorVariation: 0.15   // Variação da cor das pedras
    };
    
    // Materiais para as pedras (variações de cinza)
    const stoneMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x7D7D7D, roughness: 0.9, metalness: 0.1 }), // Cinza médio
        new THREE.MeshStandardMaterial({ color: 0x9E9E9E, roughness: 0.8, metalness: 0.1 }), // Cinza claro
        new THREE.MeshStandardMaterial({ color: 0x5D5D5D, roughness: 0.9, metalness: 0.1 }), // Cinza escuro
        new THREE.MeshStandardMaterial({ color: 0x8D8D8D, roughness: 0.85, metalness: 0.1 }), // Cinza médio-claro
        new THREE.MeshStandardMaterial({ color: 0x6D6D6D, roughness: 0.9, metalness: 0.1 })  // Cinza médio-escuro
    ];
    
    // Geometrias para as pedras (versões de baixa resolução para melhor desempenho)
    const stoneGeometries = [
        new THREE.DodecahedronGeometry(1, 0),  // Dodecaedro (12 faces)
        new THREE.IcosahedronGeometry(1, 0),    // Icosaedro (20 faces)
        new THREE.TetrahedronGeometry(1, 0),    // Tetraedro (4 faces triangulares)
        new THREE.OctahedronGeometry(1, 0)     // Octaedro (8 faces triangulares)
    ];
    
    // Array para armazenar as posições das pedras (para verificar sobreposição)
    const stonePositions = [];
    
    // Função auxiliar para verificar se uma nova posição está muito próxima de pedras existentes
    function isTooClose(x, z, minDistance) {
        for (const pos of stonePositions) {
            const dx = pos.x - x;
            const dz = pos.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    // Criar pedras ao redor do lago
    for (let i = 0; i < stoneSettings.count; i++) {
        // Gerar ângulo aleatório
        const angle = Math.random() * Math.PI * 2;
        
        // Gerar distância aleatória do centro (ligeiramente maior que o raio)
        const radiusVariation = radius * (1 + Math.random() * stoneSettings.edgeVariation);
        
        // Calcular posição
        const x = Math.cos(angle) * radiusVariation;
        const z = Math.sin(angle) * radiusVariation;
        
        // Verificar se a pedra está muito próxima de outras pedras
        if (isTooClose(x, z, stoneSettings.minDistance)) {
            // Tentar novamente
            i--;
            continue;
        }
        
        // Obter altura do terreno na posição da pedra
        const terrainHeight = getTerrainHeight(centerX + x, centerZ + z);
        
        // Tamanho aleatório para a pedra
        const size = stoneSettings.minSize + Math.random() * (stoneSettings.maxSize - stoneSettings.minSize);
        
        // Selecionar geometria e material aleatórios
        const stoneGeometry = stoneGeometries[Math.floor(Math.random() * stoneGeometries.length)];
        const stoneMaterial = stoneMaterials[Math.floor(Math.random() * stoneMaterials.length)];
        
        // Criar a malha da pedra
        const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
        
        // Posicionar e dimensionar a pedra
        stone.position.set(x, terrainHeight + size * 0.5, z);
        stone.scale.set(size, size * (0.7 + Math.random() * 0.6), size);
        
        // Rotação aleatória para variação visual
        stone.rotation.x = Math.random() * Math.PI;
        stone.rotation.y = Math.random() * Math.PI;
        stone.rotation.z = Math.random() * Math.PI;
        
        // Configurar sombras
        stone.castShadow = true;
        stone.receiveShadow = true;
        
        // Adicionar ao grupo do lago
        lakeGroup.add(stone);
        
        // Armazenar a posição para verificar sobreposição
        stonePositions.push({ x, z });

        // Criar esfera de colisão para a pedra
        const stoneCenter = new THREE.Vector3(
            centerX + x,
            terrainHeight + size * 0.5,
            centerZ + z
        );
        
        // Aumentar o raio de colisão para ser mais efetivo
        const stoneRadius = size * 1.2; // Aumentado de 0.8 para 1.2
        
        // Adicionar à lista de objetos de colisão
        stoneCollisionObjects.push({
            center: stoneCenter,
            radius: stoneRadius,
            stone: stone // Referência à pedra para debug
        });

        // Debug: Visualizar esfera de colisão
        if (window.DEBUG_COLLISIONS) {
            const sphereGeometry = new THREE.SphereGeometry(stoneRadius, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.copy(stoneCenter);
            scene.add(sphere);
        }
    }
}

// Limpar todos os corpos d'água
function clearWaterBodies() {
    waterBodies.forEach(water => {
        scene.remove(water);
    });
    waterBodies = [];
    stoneCollisionObjects = []; // Limpar também os objetos de colisão das pedras
}

// Atualizar configurações dos corpos d'água
function updateWaterSettings() {
    waterSettings.enabled = document.getElementById('enableWater').checked;
}