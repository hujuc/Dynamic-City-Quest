// Configurar interface do usuário
function setupUI() {
    // Função para validar e corrigir valores numéricos
    function validateNumericInput(input, min, max) {
        let value = parseInt(input.value);
        if (isNaN(value)) value = min;
        value = Math.max(min, Math.min(max, value));
        input.value = value;
        return value;
    }

    // Controles de terreno
    document.getElementById('terrainHeight').addEventListener('input', function() {
        const value = validateNumericInput(this, 0, 15);
        document.getElementById('terrainHeightValue').textContent = value;
    });
    
    document.getElementById('terrainSmoothing').addEventListener('input', function() {
        const value = validateNumericInput(this, 1, 10);
        document.getElementById('terrainSmoothingValue').textContent = value;
    });
    
    // Habilitar/desabilitar controles de terreno
    document.getElementById('enableTerrain').addEventListener('change', function() {
        const terrainControls = document.querySelectorAll('#terrainHeight, #terrainSmoothing');
        terrainControls.forEach(control => {
            control.disabled = !this.checked;
        });
    });
    
    // Controles de árvores
    document.getElementById('treeCount').addEventListener('input', function() {
        const value = validateNumericInput(this, 0, 200);
        document.getElementById('treeCountValue').textContent = value;
    });

    // Validar inputs numéricos
    const numericInputs = {
        'gridSize': { min: 3, max: 7 },
        'streetWidth': { min: 5, max: 15 },
        'buildingSize': { min: 5, max: 15 },
        'buildingHeight': { min: 5, max: 50 }
    };

    // Adicionar validação para cada input numérico
    Object.entries(numericInputs).forEach(([id, limits]) => {
        const input = document.getElementById(id);
        input.addEventListener('change', function() {
            validateNumericInput(this, limits.min, limits.max);
        });
        input.addEventListener('blur', function() {
            validateNumericInput(this, limits.min, limits.max);
        });
    });
    
    // Verificar se pelo menos uma espécie está selecionada
    document.querySelectorAll('.tree-species-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const anyChecked = [...document.querySelectorAll('.tree-species-checkbox')].some(cb => cb.checked);
            
            // Se nenhuma espécie estiver selecionada, desabilitar controle de número de árvores
            document.getElementById('treeCount').disabled = !anyChecked;
            
            if (!anyChecked) {
                document.getElementById('treeCountValue').textContent = "Nenhuma espécie selecionada";
            } else {
                document.getElementById('treeCountValue').textContent = document.getElementById('treeCount').value;
            }
        });
    });
}