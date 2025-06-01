// Configurar interface do usuário
function setupUI() {
    // Controles de terreno
    document.getElementById('terrainHeight').addEventListener('input', function() {
        document.getElementById('terrainHeightValue').textContent = this.value;
    });
    
    document.getElementById('terrainSmoothing').addEventListener('input', function() {
        document.getElementById('terrainSmoothingValue').textContent = this.value;
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
        document.getElementById('treeCountValue').textContent = this.value;
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