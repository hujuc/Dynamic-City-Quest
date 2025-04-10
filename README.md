# Dynamic City Quest

## Gerador de Cidade Procedural 3D

Este projeto é um sistema dinâmico e interativo de geração e exploração de cidades 3D, desenvolvido com Three.js. O foco principal é criar layouts de cidades procedurais que se adaptam a parâmetros definidos pelo utilizador, proporcionando uma experiência única a cada geração. O sistema permite exploração em primeira pessoa através dos controlos FirstPersonControls do Three.js, oferecendo uma experiência imersiva na cidade gerada.

## Demo

A versão mais recente do projeto está disponível para teste em: [https://hujuc.github.io/Dynamic-City-Quest/](https://hujuc.github.io/Dynamic-City-Quest/)

## Funcionalidades Implementadas

### 1. Geração de Terreno
- **Terreno Plano e com Elevação**: Sistema que permite alternar entre terreno plano e terreno com elevação
- **Geração de Mapa de Altura**: Algoritmo que cria variações naturais no terreno usando funções trigonométricas
- **Suavização do Terreno**: Controlo sobre o nível de suavização do terreno
- **Área Central Plana**: O centro da cidade é mantido mais plano para facilitar a construção

### 2. Sistema de Ruas
- **Malha de Ruas Adaptativa**: Ruas que se adaptam ao relevo do terreno
- **Geometria Adaptativa**: Implementação de malha bidimensional que segue o terreno em todas as direções
- **Material Realista**: Ruas com material que recebe sombras e tem aparência realista

### 3. Edifícios
- **Diversidade Arquitetónica**: Sistema que gera diferentes tipos de edifícios
- **Fundações Adaptativas**: Edifícios com fundações que se estendem abaixo do terreno
- **Sistema de LOD (Level of Detail)**: Diferentes níveis de detalhe baseados na distância da câmara
- **Janelas e Detalhes**: Implementação de janelas e outros detalhes arquitetónicos

### 4. Parques e Áreas Verdes
- **Geração de Parques**: Sistema que cria parques com caminhos, coretos e bancos
- **Adaptação ao Terreno**: Parques que seguem a topografia do terreno
- **Vegetação**: Sistema de geração de árvores e outras plantas

### 5. Corpos de Água
- **Lagos Adaptativos**: Implementação de lagos que se adaptam ao terreno
- **Superfície da Água**: Efeitos de transparência e reflexão
- **Pedras Decorativas**: Sistema que adiciona pedras à volta dos lagos

### 6. Sistema de Câmara
- **Múltiplos Modos de Visualização**: Primeira pessoa, voo e vista aérea
- **Adaptação ao Terreno**: A câmara ajusta-se à altura do terreno
- **Sistema de Neblina**: Implementação de neblina para efeito de distância

## Partes Complexas do Sistema

### 1. Adaptação ao Terreno
O sistema implementa uma abordagem sofisticada para lidar com o relevo do terreno:

#### Ruas Adaptativas
```javascript
// Malha bidimensional que segue o terreno
const lengthSegments = 40;
const widthSegments = 8;

// Para cada ponto ao longo da rua
for (let i = 0; i <= lengthSegments; i++) {
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    
    // Vetor perpendicular à direção da rua
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    // Distribuir vértices na largura
    for (let j = 0; j <= widthSegments; j++) {
        const offset = normal.clone().multiplyScalar(w * halfWidth);
        const height = getTerrainHeight(vertexX, vertexZ) + 0.15;
    }
}
```

#### Edifícios com Fundações
```javascript
// Fundação que se estende abaixo do terreno
const foundationHeight = 10;
const foundationGeometry = new THREE.BoxGeometry(size * 1.1, foundationHeight, size * 1.1);
const foundation = new THREE.Mesh(foundationGeometry, foundationMaterial);
foundation.position.set(0, -foundationHeight/2, 0);
```

### 2. Sistema de LOD (Level of Detail)
O sistema implementa um LOD sofisticado para otimizar o desempenho:

```javascript
const LOD_DISTANCES = {
    HIGH: 50,    // Distância para detalhes altos
    MEDIUM: 100, // Distância para detalhes médios
    LOW: 200     // Distância para detalhes baixos
};

// Atualização dinâmica do LOD baseado na distância
function updateBuildingLODs() {
    cityObjects.forEach(building => {
        const distance = camera.position.distanceTo(building.position);
        const lod = building.children[0];
        
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
```

### 3. Geração de Mapa de Altura
O sistema usa uma abordagem complexa para gerar terreno natural:

```javascript
function generateHeightMap(size, maxHeight, smoothing) {
    const heightMap = Array(size).fill().map(() => Array(size).fill(0));
    const iterations = 11 - smoothing;
    
    for (let i = 0; i < iterations; i++) {
        const scale = 1.0 / (i + 1);
        
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                heightMap[x][y] += maxHeight * scale * 0.5 * (
                    Math.sin(x * 0.1 * scale + i) * 
                    Math.cos(y * 0.1 * scale + i) + 
                    Math.sin(x * 0.05 * scale + y * 0.05 * scale + i * 0.5)
                );
            }
        }
    }
    
    // Suavizar o centro
    const center = size / 2;
    const flattenRadius = size / 4;
    
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
            if (distance < flattenRadius) {
                const flattenFactor = distance / flattenRadius;
                heightMap[x][y] *= flattenFactor * flattenFactor;
            }
        }
    }
    
    return heightMap;
}
```

## Próximos Passos

### 1. Melhorias na Geração Procedural
- **Diversificação de Edifícios**: Implementar mais tipos de edifícios com diferentes estilos arquitetónicos
- **Sistema de Árvores**: Adicionar diferentes espécies de árvores com variações visuais
- **Parâmetros de Geração**: Expandir as opções de personalização da cidade (densidade, estilo, etc.)

### 2. Interatividade e Navegação
- **Sistema de Passeios**: Implementar passeios e áreas de peões
- **Navegação Aprimorada**: Melhorar o sistema de navegação em primeira pessoa
- **Colisões**: Implementar sistema de colisão com edifícios e elementos da cidade

### 3. Efeitos Visuais e Ambientais
- **Iluminação Dinâmica**: Implementar sistema de iluminação noturna com candeeiros de rua
- **Sistema de Clima**: Adicionar efeitos de chuva e neblina
- **Ciclo Dia/Noite**: Implementar transição suave entre dia e noite

### 4. Mini-Jogo: "O Segredo da Cidade Perdida"
- **Sistema de Pistas**: Implementar pistas e quebra-cabeças distribuídos pela cidade
- **Artefacto Escondido**: Criar um artefacto especial para ser encontrado
- **Sala Secreta**: Implementar uma sala secreta no museu da cidade
- **Cena Final**: Criar uma animação de conclusão quando o segredo for descoberto

### 5. Otimizações e Desempenho
- **Melhorias no LOD**: Refinar o sistema de Level of Detail
- **Otimização de Texturas**: Implementar sistema de carregamento otimizado de texturas
- **Gestão de Memória**: Melhorar a gestão de recursos para cidades maiores

## Tecnologias Utilizadas
- Three.js para renderização 3D
- JavaScript para lógica do sistema
- HTML/CSS para interface do utilizador