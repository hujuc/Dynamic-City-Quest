// Criar o chão do parque seguindo a topografia do terreno
function createParkGround(parkGroup, centerX, centerZ, size) {
    // Criar uma geometria de terreno mais detalhada para o parque
    const segments = 20; // Maior número de segmentos para melhor detalhe
    const floorGeometry = new THREE.PlaneGeometry(size, size, segments, segments);
    
    // Ajustar cada vértice para seguir a altura do terreno
    const vertices = floorGeometry.attributes.position.array;
    
    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
        // Converter coordenadas locais da geometria para coordenadas do mundo
        const x = vertices[i] + centerX;
        const z = vertices[i + 2] + centerZ;
        
        // Obter altura do terreno neste ponto
        const height = getTerrainHeight(x, z);
        
        // Aplicar a altura com um pequeno offset para ficar acima do terreno
        vertices[i + 1] = height + 0.05;
    }
    
    // Atualizar normais para iluminação correta
    floorGeometry.computeVertexNormals();
    
    // Rotacionar para estar no plano correto
    floorGeometry.rotateX(-Math.PI / 2);
    
    // Material do chão (grama mais vibrante)
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4CBB17,
        roughness: 0.8,
        metalness: 0.1
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    parkGroup.add(floor);
    
    return floor;
}// Variáveis globais para parques
let parks = [];
let parksSettings = {
    enabled: true,
    probability: 0.2  // Probabilidade de um bloco ser um parque (20%)
};

// Criar um parque em uma posição específica
function createPark(centerX, centerZ, size) {
    const parkGroup = new THREE.Group();
    
    // Obter altura do terreno no centro do parque
    const terrainHeight = getTerrainHeight(centerX, centerZ);
    
    // Criar o chão do parque seguindo a topografia do terreno
    createParkGround(parkGroup, centerX, centerZ, size);
    
    // Criar caminhos cruzados no parque
    createParkPaths(parkGroup, centerX, centerZ, size);
    
    // Adicionar um gazebo/coreto no centro
    createGazebo(parkGroup, centerX, centerZ, size / 10);
    
    // Adicionar bancos
    createBenches(parkGroup, centerX, centerZ, size);
    
    // Posicionar o parque
    parkGroup.position.set(centerX, 0, centerZ);
    
    // Adicionar à cena
    scene.add(parkGroup);
    parks.push(parkGroup);
    cityObjects.push(parkGroup);
    
    // Adicionar árvores especificamente dentro do parque
    addParkTrees(centerX, centerZ, size);
    
    return parkGroup;
}

// Criar caminhos no parque
function createParkPaths(parkGroup, centerX, centerZ, size) {
    const pathWidth = size / 10;
    const pathMaterial = new THREE.MeshStandardMaterial({
        color: 0xC2B280,  // Bege para simular cascalho
        roughness: 1.0,
        metalness: 0.0
    });
    
    // Caminho horizontal
    const horizontalPathGeometry = new THREE.PlaneGeometry(size * 0.8, pathWidth, 20, 4);
    
    // Ajustar cada vértice para seguir a altura do terreno (com um offset mínimo)
    const hVertices = horizontalPathGeometry.attributes.position.array;
    
    for (let i = 0, j = 0; i < hVertices.length; i += 3, j++) {
        // Converter coordenadas locais para coordenadas do mundo
        const x = hVertices[i] + centerX;
        const z = hVertices[i + 2] + centerZ;
        
        // Obter altura do terreno neste ponto
        const height = getTerrainHeight(x, z);
        
        // Aplicar a altura com um pequeno offset
        hVertices[i + 1] = height + 0.06;
    }
    
    horizontalPathGeometry.computeVertexNormals();
    horizontalPathGeometry.rotateX(-Math.PI / 2);
    
    const horizontalPath = new THREE.Mesh(horizontalPathGeometry, pathMaterial);
    horizontalPath.receiveShadow = true;
    parkGroup.add(horizontalPath);
    
    // Caminho vertical
    const verticalPathGeometry = new THREE.PlaneGeometry(pathWidth, size * 0.8, 4, 20);
    
    // Ajustar cada vértice para seguir a altura do terreno
    const vVertices = verticalPathGeometry.attributes.position.array;
    
    for (let i = 0, j = 0; i < vVertices.length; i += 3, j++) {
        // Converter coordenadas locais para coordenadas do mundo
        const x = vVertices[i] + centerX;
        const z = vVertices[i + 2] + centerZ;
        
        // Obter altura do terreno neste ponto
        const height = getTerrainHeight(x, z);
        
        // Aplicar a altura com um pequeno offset
        vVertices[i + 1] = height + 0.06;
    }
    
    verticalPathGeometry.computeVertexNormals();
    verticalPathGeometry.rotateX(-Math.PI / 2);
    
    const verticalPath = new THREE.Mesh(verticalPathGeometry, pathMaterial);
    verticalPath.receiveShadow = true;
    parkGroup.add(verticalPath);
}

// Criar um gazebo/coreto central
function createGazebo(parkGroup, centerX, centerZ, size) {
    // Obter altura do terreno no centro
    const baseHeight = getTerrainHeight(centerX, centerZ);
    
    // Base do gazebo
    const baseGeometry = new THREE.CylinderGeometry(size, size, 0.5, 8);
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0xA0522D,  // Marrom
        roughness: 0.8,
        metalness: 0.2
    });
    
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, baseHeight + 0.25, 0);
    base.receiveShadow = true;
    base.castShadow = true;
    parkGroup.add(base);
    
    // Colunas
    const numColumns = 6;
    const columnHeight = 4.5;
    const columnRadius = 0.1;
    
    for (let i = 0; i < numColumns; i++) {
        const angle = (i / numColumns) * Math.PI * 2;
        const columnGeometry = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 8);
        const column = new THREE.Mesh(columnGeometry, baseMaterial);
        
        const x = Math.sin(angle) * (size * 0.8);
        const z = Math.cos(angle) * (size * 0.8);
        
        // Obter altura neste ponto específico
        const height = getTerrainHeight(centerX + x, centerZ + z);
        
        column.position.set(x, height + columnHeight / 2 + 0.5, z);
        column.castShadow = true;
        parkGroup.add(column);
    }
    
    // Teto do gazebo
    const roofGeometry = new THREE.ConeGeometry(size * 1.2, size, 8);
    const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Marrom escuro
        roughness: 0.9,
        metalness: 0.1
    });
    
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, baseHeight + columnHeight + 0.6 + size / 4, 0);
    roof.castShadow = true;
    parkGroup.add(roof);
}

// Criar bancos no parque
// Criar bancos no parque
function createBenches(parkGroup, centerX, centerZ, size) {
    const benchMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Marrom
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Posições dos bancos (em diferentes áreas do parque)
    const benchPositions = [
        { x: size * 0.3, z: 0 },
        { x: -size * 0.3, z: 0 },
        { x: 0, z: size * 0.3 },
        { x: 0, z: -size * 0.3 }
    ];
    
    benchPositions.forEach(pos => {
        // Obter altura do terreno na posição do banco
        const worldX = centerX + pos.x;
        const worldZ = centerZ + pos.z;
        const height = getTerrainHeight(worldX, worldZ);
        
        // Criar um grupo para cada banco para facilitar rotação
        const benchGroup = new THREE.Group();
        benchGroup.position.set(pos.x, height + 0.3, pos.z);
        
        // Calcular ângulo para o banco olhar para o centro
        const angle = Math.atan2(-pos.x, -pos.z);
        benchGroup.rotation.y = angle;
        
        // Base do banco
        const seatGeometry = new THREE.BoxGeometry(size / 8, 0.1, size / 20);
        const seat = new THREE.Mesh(seatGeometry, benchMaterial);
        seat.position.set(0, 0.2, 0);
        seat.castShadow = true;
        benchGroup.add(seat);
        
        // Pernas do banco
        const legGeometry = new THREE.BoxGeometry(0.1, 0.4, size / 20);
        
        // Duas pernas para cada banco
        for (let i = -1; i <= 1; i += 2) {
            const leg = new THREE.Mesh(legGeometry, benchMaterial);
            leg.position.set(i * (size / 20), -0.1, 0);
            leg.castShadow = true;
            benchGroup.add(leg);
        }
        
        // Encosto do banco
        const backGeometry = new THREE.BoxGeometry(size / 8, 0.2, 0.05);
        const back = new THREE.Mesh(backGeometry, benchMaterial);
        back.position.set(0, 0.3, -size / 40);
        back.castShadow = true;
        benchGroup.add(back);
        
        // Adicionar o grupo do banco ao grupo do parque
        parkGroup.add(benchGroup);
    });
}

// Adicionar árvores específicas no parque
function addParkTrees(centerX, centerZ, size) {
    // Número de árvores baseado no tamanho do parque
    const numTrees = Math.floor(size / 3);
    
    // Adicionar árvores ao redor do parque, evitando os caminhos
    for (let i = 0; i < numTrees; i++) {
        // Posição aleatória dentro do parque
        let x, z;
        let isOnPath = true;
        
        // Evitar posicionar árvores nos caminhos ou muito perto deles
        while (isOnPath) {
            // Posição relativa ao centro do parque
            const relX = (Math.random() * 0.9 - 0.45) * size;
            const relZ = (Math.random() * 0.9 - 0.45) * size;
            
            x = centerX + relX;
            z = centerZ + relZ;
            
            // Verificar se está longe dos caminhos
            const distToHorizPath = Math.abs(relZ);
            const distToVertPath = Math.abs(relX);
            const pathWidth = size / 10 * 0.7; // 70% da largura do caminho para dar margem
            
            isOnPath = (distToHorizPath < pathWidth || distToVertPath < pathWidth);
            
            // Evitar também o centro (gazebo)
            const distToCenter = Math.sqrt(relX * relX + relZ * relZ);
            if (distToCenter < size / 5) {
                isOnPath = true;
            }
        }
        
        // Obter altura do terreno na posição da árvore
        const y = getTerrainHeight(x, z);
        
        // Selecionar uma espécie aleatória (apenas tipos específicos para parques)
        const parkTreeTypes = [0, 1, 3]; // Pinheiro, Carvalho, Bétula
        const speciesIndex = parkTreeTypes[Math.floor(Math.random() * parkTreeTypes.length)];
        
        // Criar a árvore
        createTree(x, y, z, treeSpecies[speciesIndex]);
    }
}

// Limpar todos os parques
function clearParks() {
    parks.forEach(park => {
        scene.remove(park);
    });
    parks = [];
}

// Atualizar configurações dos parques
function updateParksSettings() {
    parksSettings.enabled = document.getElementById('enableParks').checked;
}