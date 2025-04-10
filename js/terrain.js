// Criar terreno plano (sem elevação)
function createFlatTerrain() {
    if (terrain) {
        scene.remove(terrain);
        terrain.geometry.dispose();
        terrain.material.dispose();
    }
    
    const terrainSize = 500;
    const terrainSegments = 128;
    
    // IMPORTANTE: Limpar o heightData quando criamos um terreno plano
    heightData = null;
    
    // Criar geometria do terreno
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    geometry.rotateX(-Math.PI / 2);
    
    // Material do terreno
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a5e1a,
        roughness: 0.8,
        metalness: 0.2
    });
    
    terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    scene.add(terrain);

    if (typeof adjustCameraToTerrain === 'function') {
        adjustCameraToTerrain();
    }
}

// Criar terreno com elevação
function createTerrainWithElevation(maxHeight, smoothing) {
    if (terrain) {
        scene.remove(terrain);
        terrain.geometry.dispose();
        terrain.material.dispose();
    }
    
    const terrainSize = 500;
    const terrainSegments = 128;
    
    // Criar geometria do terreno
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    
    // Gerar dados de altura para o terreno
    const terrainData = generateHeightMap(terrainSegments + 1, maxHeight, smoothing);
    heightData = terrainData;
    
    // Aplicar elevação aos vértices
    const vertices = geometry.attributes.position.array;
    for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
        const x = Math.floor(j % (terrainSegments + 1));
        const y = Math.floor(j / (terrainSegments + 1));
        
        if (x < terrainData.length && y < terrainData[0].length) {
            vertices[i + 2] = terrainData[x][y]; // Z é a altura no PlaneGeometry
        }
    }
    
    // Atualizar as normais para iluminação correta
    geometry.computeVertexNormals();
    
    // Rotacionar para ficar na horizontal
    geometry.rotateX(-Math.PI / 2);
    
    // Material do terreno
    const material = new THREE.MeshStandardMaterial({
        color: 0x1a5e1a,
        roughness: 0.8,
        metalness: 0.2
    });
    
    terrain = new THREE.Mesh(geometry, material);
    terrain.receiveShadow = true;
    scene.add(terrain);

    if (typeof adjustCameraToTerrain === 'function') {
        adjustCameraToTerrain();
    }
}

// Gerar mapa de altura para o terreno
function generateHeightMap(size, maxHeight, smoothing) {
    // Criar matriz para armazenar as alturas
    const heightMap = Array(size).fill().map(() => Array(size).fill(0));
    
    // Número de iterações para suavização
    const iterations = 11 - smoothing; // Inverter: 1 = muito suave, 10 = muito áspero
    
    // Gerar ruído aleatório
    for (let i = 0; i < iterations; i++) {
        const scale = 1.0 / (i + 1); // Cada iteração tem um impacto menor
        
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                // Usar funções trigonométricas com frequências diferentes para criar um padrão mais natural
                heightMap[x][y] += maxHeight * scale * 0.5 * (
                    Math.sin(x * 0.1 * scale + i) * 
                    Math.cos(y * 0.1 * scale + i) + 
                    Math.sin(x * 0.05 * scale + y * 0.05 * scale + i * 0.5)
                );
            }
        }
    }
    
    // Ajustar para que o centro da cidade seja mais plano (para edifícios)
    const center = size / 2;
    const flattenRadius = size / 4; // Área plana no centro
    
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            // Calcular distância do centro
            const dx = x - center;
            const dy = y - center;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Suavizar o centro
            if (distance < flattenRadius) {
                // Área totalmente plana no centro
                const flattenFactor = distance / flattenRadius;
                heightMap[x][y] *= flattenFactor * flattenFactor;
            }
        }
    }
    
    return heightMap;
}

// Encontrar a altura do terreno em uma posição específica
function getTerrainHeight(x, z) {
    // Se não houver dados de altura (terreno plano), retornar 0
    if (!heightData) return 0;
    
    // Converter de coordenadas do mundo para índices no mapa de altura
    const terrainSize = 500;
    const segments = heightData.length - 1;
    
    // Ajustar para coordenadas de 0 a segments
    const normalizedX = ((x + terrainSize / 2) / terrainSize) * segments;
    const normalizedZ = ((z + terrainSize / 2) / terrainSize) * segments;
    
    // Calcular índices de grid e pesos para interpolação bilinear
    const x1 = Math.floor(normalizedX);
    const z1 = Math.floor(normalizedZ);
    const x2 = Math.min(x1 + 1, segments);
    const z2 = Math.min(z1 + 1, segments);
    
    const weightX = normalizedX - x1;
    const weightZ = normalizedZ - z1;
    
    // Garantir que os índices estão dentro dos limites
    if (x1 < 0 || x1 >= heightData.length || z1 < 0 || z1 >= heightData[0].length) {
        return 0;
    }
    
    // Interpolação bilinear para suavizar a altura
    const h1 = heightData[x1][z1];
    const h2 = heightData[x2][z1];
    const h3 = heightData[x1][z2];
    const h4 = heightData[x2][z2];
    
    const height1 = h1 * (1 - weightX) + h2 * weightX;
    const height2 = h3 * (1 - weightX) + h4 * weightX;
    
    return height1 * (1 - weightZ) + height2 * weightZ;
}