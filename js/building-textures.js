// Sistema de texturas para edifícios
const BUILDING_TEXTURES = [
    {
        name: 'Bricks058',
        path: 'textures/buildings/Bricks058/Bricks058_1K-JPG_Color.jpg',
        normal: 'textures/buildings/Bricks058/Bricks058_1K-JPG_NormalGL.jpg',
        roughness: 'textures/buildings/Bricks058/Bricks058_1K-JPG_Roughness.jpg',
        ao: 'textures/buildings/Bricks058/Bricks058_1K-JPG_AmbientOcclusion.jpg',
        repeat: { x: 2, y: 2 }
    },
    {
        name: 'Planks021',
        path: 'textures/buildings/Planks021/Planks021_1K-JPG_Color.jpg',
        normal: 'textures/buildings/Planks021/Planks021_1K-JPG_NormalGL.jpg',
        roughness: 'textures/buildings/Planks021/Planks021_1K-JPG_Roughness.jpg',
        ao: 'textures/buildings/Planks021/Planks021_1K-JPG_AmbientOcclusion.jpg',
        repeat: { x: 3, y: 1 }
    },
    {
        name: 'Bricks097',
        path: 'textures/buildings/Bricks097/Bricks097_1K-JPG_Color.jpg',
        normal: 'textures/buildings/Bricks097/Bricks097_1K-JPG_NormalGL.jpg',
        roughness: 'textures/buildings/Bricks097/Bricks097_1K-JPG_Roughness.jpg',
        ao: 'textures/buildings/Bricks097/Bricks097_1K-JPG_AmbientOcclusion.jpg',
        repeat: { x: 2, y: 2 }
    },
    {
        name: 'Plaster007',
        path: 'textures/buildings/Plaster007/Plaster007_1K-JPG_Color.jpg',
        normal: 'textures/buildings/Plaster007/Plaster007_1K-JPG_NormalGL.jpg',
        roughness: 'textures/buildings/Plaster007/Plaster007_1K-JPG_Roughness.jpg',
        ao: 'textures/buildings/Plaster007/Plaster007_1K-JPG_AmbientOcclusion.jpg',
        repeat: { x: 3, y: 2 }
    }
];

// Cache de materiais para reutilização
const materialCache = new Map();

// Carregar uma textura com configurações padrão
function loadTexture(path, repeat) {
    const texture = new THREE.TextureLoader().load(path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat.x, repeat.y);
    return texture;
}

// Criar um material PBR com as texturas especificadas
function createBuildingMaterial(textureSet) {
    // Verificar se já temos este material em cache
    if (materialCache.has(textureSet.name)) {
        return materialCache.get(textureSet.name);
    }

    // Carregar todas as texturas
    const colorMap = loadTexture(textureSet.path, textureSet.repeat);
    const normalMap = loadTexture(textureSet.normal, textureSet.repeat);
    const roughnessMap = loadTexture(textureSet.roughness, textureSet.repeat);
    const aoMap = loadTexture(textureSet.ao, textureSet.repeat);

    // Criar material PBR
    const material = new THREE.MeshStandardMaterial({
        map: colorMap,
        normalMap: normalMap,
        roughnessMap: roughnessMap,
        aoMap: aoMap,
        roughness: 1.0,
        metalness: 0.1
    });

    // Armazenar no cache
    materialCache.set(textureSet.name, material);
    return material;
}

// Obter um material aleatório para um edifício
function getRandomBuildingMaterial() {
    const randomIndex = Math.floor(Math.random() * BUILDING_TEXTURES.length);
    return createBuildingMaterial(BUILDING_TEXTURES[randomIndex]);
}

// Função para preparar a geometria para texturas
function prepareGeometryForTextures(geometry) {
    // Garantir que temos UV2 para o aoMap
    if (!geometry.attributes.uv2) {
        geometry.attributes.uv2 = geometry.attributes.uv;
    }
    return geometry;
}

// Exportar funções
window.getRandomBuildingMaterial = getRandomBuildingMaterial;
window.prepareGeometryForTextures = prepareGeometryForTextures; 