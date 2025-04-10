// Definições das espécies de árvores
const treeSpecies = [
    {
        name: "Pinheiro",
        trunkColor: 0x8B4513,
        foliageColor: 0x2E8B57,
        trunkHeight: 3.5,
        trunkRadius: 0.5,
        foliageShape: "cone",
        foliageHeight: 7,
        foliageRadius: 2.5,
        foliageSegments: 8
    },
    {
        name: "Carvalho",
        trunkColor: 0x8B5A2B,
        foliageColor: 0x228B22,
        trunkHeight: 2.5,
        trunkRadius: 0.7,
        foliageShape: "sphere",
        foliageHeight: 6,
        foliageRadius: 3.5,
        foliageSegments: 8
    },
    {
        name: "Palmeira",
        trunkColor: 0xA0522D,
        foliageColor: 0x32CD32,
        trunkHeight: 5,
        trunkRadius: 0.4,
        foliageShape: "palm",
        foliageHeight: 3,
        foliageRadius: 4,
        foliageSegments: 8
    },
    {
        name: "Bétula",
        trunkColor: 0xF5F5DC,
        foliageColor: 0x9ACD32,
        trunkHeight: 3,
        trunkRadius: 0.4,
        foliageShape: "sphere",
        foliageHeight: 5,
        foliageRadius: 2.5,
        foliageSegments: 8
    }
];

// Array para armazenar todas as árvores
let trees = [];

// Configurações atuais de geração de árvores
let treeSettings = {
    count: 50,
    selectedSpecies: []  // IDs das espécies selecionadas (0-4)
};

// Função auxiliar para verificar se uma posição está dentro de um bloco da cidade ou rua
function isPositionInCityBlock(x, z, cityBlocks, streetWidth, totalSize) {
    const halfSize = totalSize / 2;
    
    // Verificar se está dentro da área total da cidade (incluindo ruas)
    if (Math.abs(x) > halfSize || Math.abs(z) > halfSize) {
        return false;
    }
    
    // Verificar se está em uma rua
    const gridSize = Math.sqrt(cityBlocks.length);
    const blockSize = cityBlocks[0].size;
    
    // Verificar ruas horizontais
    for (let i = 0; i <= gridSize; i++) {
        const streetZ = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
        if (Math.abs(z - streetZ) <= streetWidth / 2) {
            return true;
        }
    }
    
    // Verificar ruas verticais
    for (let i = 0; i <= gridSize; i++) {
        const streetX = -halfSize + i * (blockSize + streetWidth) + streetWidth / 2;
        if (Math.abs(x - streetX) <= streetWidth / 2) {
            return true;
        }
    }
    
    // Verificar se está dentro de um bloco da cidade
    for (const block of cityBlocks) {
        const blockSize = block.size;
        const halfBlockSize = blockSize / 2;
        
        // Verificar se a posição está dentro do bloco
        if (Math.abs(x - block.x) <= halfBlockSize && Math.abs(z - block.z) <= halfBlockSize) {
            return true;
        }
    }
    
    return false;
}

// Gerar árvores baseadas nas configurações atuais
function generateTrees() {
    // Remover árvores existentes
    clearTrees();
    
    // Se não houver espécies selecionadas, não gerar árvores
    if (treeSettings.selectedSpecies.length === 0 || treeSettings.count === 0) {
        return [];
    }
    
    // Criar lista de espécies geradas para exibição
    const generatedSpeciesList = document.getElementById('generatedSpeciesList');
    generatedSpeciesList.innerHTML = '';
    
    // Objeto para contar quantas árvores de cada espécie foram geradas
    const speciesCount = {};
    treeSettings.selectedSpecies.forEach(speciesIndex => {
        speciesCount[speciesIndex] = 0;
    });
    
    // Obter o tamanho total da cidade para posicionar as árvores
    const terrainSize = 500;
    const halfSize = terrainSize / 2;
    
    // Obter informações dos blocos da cidade
    const cityBlocks = [];
    const gridSize = parseInt(document.getElementById('gridSize').value);
    const streetWidth = parseInt(document.getElementById('streetWidth').value);
    const buildingSize = parseInt(document.getElementById('buildingSize').value);
    const blockSize = buildingSize * 3;
    const totalSize = (gridSize * blockSize) + ((gridSize + 1) * streetWidth);
    const cityHalfSize = totalSize / 2;
    
    // Coletar informações dos blocos da cidade
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const blockX = -cityHalfSize + streetWidth + (i * (blockSize + streetWidth)) + blockSize / 2;
            const blockZ = -cityHalfSize + streetWidth + (j * (blockSize + streetWidth)) + blockSize / 2;
            cityBlocks.push({ x: blockX, z: blockZ, size: blockSize });
        }
    }
    
    // Gerar posições das árvores e suas espécies
    let treePositions = [];
    let attempts = 0;
    const maxAttempts = treeSettings.count * 5; // Limite de tentativas para evitar loops infinitos
    
    while (treePositions.length < treeSettings.count && attempts < maxAttempts) {
        attempts++;
        
        // Posição aleatória no terreno
        const x = (Math.random() * 2 - 1) * halfSize * 0.9; // 90% do terreno para evitar bordas
        const z = (Math.random() * 2 - 1) * halfSize * 0.9;
        
        // Verificar se a posição está dentro da área da cidade (incluindo ruas)
        if (isPositionInCityBlock(x, z, cityBlocks, streetWidth, totalSize)) {
            continue;
        }
        
        // Selecionar aleatoriamente uma espécie das selecionadas
        const speciesIndex = treeSettings.selectedSpecies[
            Math.floor(Math.random() * treeSettings.selectedSpecies.length)
        ];
        
        // Obter altura do terreno na posição da árvore
        const y = getTerrainHeight(x, z);
        
        // Armazenar posição e espécie
        treePositions.push({
            x, y, z, speciesIndex
        });
    }
    
    // Ajustar para garantir que tenhamos exatamente o número de árvores solicitado
    treePositions = treePositions.slice(0, treeSettings.count);
    
    // Criar todas as árvores
    treePositions.forEach(pos => {
        createTree(pos.x, pos.y, pos.z, treeSpecies[pos.speciesIndex]);
        speciesCount[pos.speciesIndex]++;
    });
    
    // Verificar o total de árvores geradas
    const totalGenerated = Object.values(speciesCount).reduce((sum, count) => sum + count, 0);
    console.log(`Árvores solicitadas: ${treeSettings.count}, Árvores geradas: ${totalGenerated}`);
    
    // Atualizar a lista de espécies geradas
    if (Object.keys(speciesCount).length > 0) {
        for (const index in speciesCount) {
            const li = document.createElement('li');
            li.textContent = `${treeSpecies[index].name}: ${speciesCount[index]}`;
            generatedSpeciesList.appendChild(li);
        }
    } else {
        generatedSpeciesList.innerHTML = '<li>Nenhuma árvore gerada</li>';
    }
    
    return trees;
}

// Criar uma árvore individual
function createTree(x, y, z, species) {
    const treeGroup = new THREE.Group();
    
    // Verificar se a altura foi fornecida, caso contrário, obter do terreno
    if (y === undefined) {
        y = getTerrainHeight(x, z);
    }
    
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(
        species.trunkRadius, 
        species.trunkRadius * 1.2, 
        species.trunkHeight, 
        8
    );
    
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: species.trunkColor,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = species.trunkHeight / 2;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);
    
    // Folhagem
    let foliageGeometry;
    let foliageMaterial = new THREE.MeshStandardMaterial({
        color: species.foliageColor,
        roughness: 0.8,
        metalness: 0.1
    });
    
    switch (species.foliageShape) {
        case "cone":
            foliageGeometry = new THREE.ConeGeometry(
                species.foliageRadius,
                species.foliageHeight,
                species.foliageSegments
            );
            break;
            
        case "sphere":
            foliageGeometry = new THREE.SphereGeometry(
                species.foliageRadius,
                species.foliageSegments,
                species.foliageSegments / 2
            );
            break;
            
        case "palm":
            // Para palmeiras, criamos várias folhas em vez de uma única forma
            createPalmFoliage(treeGroup, species, species.trunkHeight);
            break;
            
        default:
            foliageGeometry = new THREE.ConeGeometry(
                species.foliageRadius,
                species.foliageHeight,
                species.foliageSegments
            );
    }
    
    // Adicionar folhagem (exceto para palmeiras que são tratadas separadamente)
    if (species.foliageShape !== "palm") {
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = species.trunkHeight + species.foliageHeight / 2;
        
        foliage.castShadow = true;
        treeGroup.add(foliage);
    }
    
    // Posicionar a árvore na altura correta do terreno
    treeGroup.position.set(x, y, z);
    
    // Adicionar à cena
    scene.add(treeGroup);
    trees.push(treeGroup);
    cityObjects.push(treeGroup); // Adicionar ao array de objetos da cidade para limpeza posterior
    
    return treeGroup;
}

// Criar folhagem especial para palmeiras
function createPalmFoliage(treeGroup, species, trunkHeight) {
    const numLeaves = 7;
    const leafLength = species.foliageRadius * 2;
    const leafWidth = species.foliageRadius / 2;
    
    // Criar material para as folhas
    const leafMaterial = new THREE.MeshStandardMaterial({
        color: species.foliageColor,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < numLeaves; i++) {
        // Criar uma folha como um plano curvo
        const leafGeometry = new THREE.PlaneGeometry(leafLength, leafWidth, 10, 1);
        
        // Curvar as folhas
        const vertices = leafGeometry.attributes.position.array;
        for (let j = 0; j < vertices.length; j += 3) {
            const x = vertices[j];
            // Curvar a folha para baixo se for positiva (longe do tronco)
            if (x > 0) {
                vertices[j + 1] = -(x / leafLength) * (x / leafLength) * leafLength * 0.5;
            }
        }
        
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        
        // Posicionar no topo do tronco
        leaf.position.y = trunkHeight + 0.2;
        
        // Rotacionar em torno do eixo Y
        leaf.rotation.y = (i / numLeaves) * Math.PI * 2;
        
        // Inclinar para baixo
        leaf.rotation.z = Math.PI / 6;
        
        leaf.castShadow = true;
        treeGroup.add(leaf);
    }
}

// Limpar árvores existentes
function clearTrees() {
    trees.forEach(tree => {
        scene.remove(tree);
    });
    trees = [];
}

// Atualizar configurações das árvores com base na UI
function updateTreeSettings() {
    treeSettings.count = parseInt(document.getElementById('treeCount').value);
    
    // Atualizar espécies selecionadas
    treeSettings.selectedSpecies = [];
    document.querySelectorAll('.tree-species-checkbox:checked').forEach(checkbox => {
        treeSettings.selectedSpecies.push(parseInt(checkbox.value));
    });
}