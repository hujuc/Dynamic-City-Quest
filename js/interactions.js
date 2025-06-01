// Variáveis para controle de interação
let interactionMessage = null;
let blackScreen = null;
let isNearTreasureChest = false;
let isNearKeyHalf = false;
let currentKeyHalf = null;
const INTERACTION_DISTANCE = 3; // Distância máxima para interação
let startTime = null; // Tempo de início da partida

// Variáveis para controle das chaves
let collectedKeys = {
    key1: false,
    key2: false
};

// Função para salvar o tempo no localStorage
function saveCompletionTime(time) {
    let times = JSON.parse(localStorage.getItem('completionTimes') || '[]');
    times.push({
        time: time,
        date: new Date().toLocaleDateString()
    });
    // Ordenar por tempo (do mais rápido para o mais lento)
    times.sort((a, b) => a.time - b.time);
    // Manter apenas os 5 melhores tempos
    times = times.slice(0, 5);
    localStorage.setItem('completionTimes', JSON.stringify(times));
    updateRankingDisplay();
}

// Função para atualizar o display do ranking
function updateRankingDisplay() {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    const times = JSON.parse(localStorage.getItem('completionTimes') || '[]');
    rankingList.innerHTML = '';

    if (times.length === 0) {
        rankingList.innerHTML = '<li>Nenhum tempo registrado</li>';
        return;
    }

    times.forEach((record, index) => {
        const minutes = Math.floor(record.time / 60);
        const seconds = Math.floor(record.time % 60);
        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const li = document.createElement('li');
        li.innerHTML = `<span class="rank">#${index + 1}</span> ${timeString} <span class="date">(${record.date})</span>`;
        rankingList.appendChild(li);
    });
}

// Criar elementos de UI
function createInteractionUI() {
    // Criar tela de final
    blackScreen = document.createElement('div');
    blackScreen.style.position = 'fixed';
    blackScreen.style.top = '0';
    blackScreen.style.left = '0';
    blackScreen.style.width = '100%';
    blackScreen.style.height = '100%';
    blackScreen.style.backgroundColor = 'black';
    blackScreen.style.display = 'none';
    blackScreen.style.zIndex = '9999';
    
    // Criar imagem de final
    const endingImage = document.createElement('img');
    endingImage.src = './textures/ending.jpg';
    endingImage.style.width = '100%';
    endingImage.style.height = '100%';
    endingImage.style.objectFit = 'cover';
    blackScreen.appendChild(endingImage);
    
    document.body.appendChild(blackScreen);

    // Criar mensagem
    interactionMessage = document.createElement('div');
    interactionMessage.style.position = 'fixed';
    interactionMessage.style.bottom = '30%';
    interactionMessage.style.left = '50%';
    interactionMessage.style.transform = 'translateX(-50%)';
    interactionMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    interactionMessage.style.color = 'white';
    interactionMessage.style.padding = '15px 30px';
    interactionMessage.style.borderRadius = '8px';
    interactionMessage.style.fontFamily = 'Arial, sans-serif';
    interactionMessage.style.fontSize = '20px';
    interactionMessage.style.display = 'none';
    interactionMessage.style.zIndex = '1000';
    interactionMessage.style.border = '2px solid gold';
    interactionMessage.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
    document.body.appendChild(interactionMessage);
}

// Mostrar tela de final
function showBlackScreen() {
    if (blackScreen) {
        blackScreen.style.display = 'block';
    }
}

// Esconder tela de final
function hideBlackScreen() {
    if (blackScreen) {
        blackScreen.style.display = 'none';
    }
}

// Verificar proximidade com objetos interativos
function checkProximity() {
    if (!camera || !cityObjects) return;
    
    isNearTreasureChest = false;
    isNearKeyHalf = false;
    currentKeyHalf = null;
    
    // Procurar por objetos interativos
    for (const object of cityObjects) {
        if (!object.userData) continue;
        
        // Calcular a posição real do objeto considerando a posição do grupo
        const objectPosition = object.userData.position || object.position;
        if (!objectPosition) continue;
        
        // Calcular distância 3D (incluindo altura)
        const dx = camera.position.x - objectPosition.x;
        const dy = camera.position.y - objectPosition.y;
        const dz = camera.position.z - objectPosition.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (distance <= INTERACTION_DISTANCE) {
            if (object.userData.isTreasureChest) {
                isNearTreasureChest = true;
                if (collectedKeys.key1 && collectedKeys.key2) {
                    showInteractionMessage('[E] Abrir Baú do Tesouro');
                } else {
                    showInteractionMessage('Precisas encontrar as duas metades da chave!');
                }
                break;
            } else if (object.userData.isKeyHalf) {
                const keyNumber = object.userData.keyNumber;
                if (!collectedKeys[`key${keyNumber}`]) {
                    isNearKeyHalf = true;
                    currentKeyHalf = object;
                    showInteractionMessage('[E] Pegar Metade da Chave');
                    break;
                }
            }
        }
    }
    
    if (!isNearTreasureChest && !isNearKeyHalf) {
        hideInteractionMessage();
    }
}

// Mostrar mensagem de interação
function showInteractionMessage(message) {
    if (interactionMessage) {
        interactionMessage.textContent = message;
        interactionMessage.style.display = 'block';
    }
}

// Esconder mensagem de interação
function hideInteractionMessage() {
    if (interactionMessage) {
        interactionMessage.style.display = 'none';
    }
}

// Coletar uma metade de chave
function collectKeyHalf(keyHalf) {
    const keyNumber = keyHalf.userData.keyNumber;
    collectedKeys[`key${keyNumber}`] = true;
    
    // Remover a chave da cena
    scene.remove(keyHalf);
    const index = cityObjects.indexOf(keyHalf);
    if (index > -1) {
        cityObjects.splice(index, 1);
    }
    
    // Mostrar mensagem de sucesso
    showInteractionMessage(`Encontraste a metade ${keyNumber} da chave!`);
    
    // Esconder a mensagem após 3 segundos
    setTimeout(() => {
        hideInteractionMessage();
    }, 3000);
}

// Função para coletar todas as chaves (batota)
function collectAllKeys() {
    // Remover todas as chaves da cena
    cityObjects.forEach((object, index) => {
        if (object.userData && object.userData.isKeyHalf) {
            scene.remove(object);
            cityObjects.splice(index, 1);
        }
    });
    
    // Marcar todas as chaves como coletadas
    collectedKeys.key1 = true;
    collectedKeys.key2 = true;
    
    // Mostrar mensagem de sucesso
    showInteractionMessage('Todas as chaves foram coletadas! 🎉');
    
    // Esconder a mensagem após 3 segundos
    setTimeout(() => {
        hideInteractionMessage();
    }, 3000);
}

// Função para limpar a cena
function clearScene() {
    // Remover todas as árvores
    clearTrees();
    // Remover todos os objetos da cidade
    cityObjects.forEach(object => {
        if (object && object.parent) {
            object.parent.remove(object);
        }
    });
    cityObjects = [];
    // Resetar as chaves coletadas
    collectedKeys.key1 = false;
    collectedKeys.key2 = false;
    // Resetar o tempo de início
    startTime = null;
    // Limpar a mensagem de interação
    hideInteractionMessage();
}

// Inicializar sistema de interação
function initInteractionSystem() {
    createInteractionUI();
    startTime = performance.now(); // Iniciar o timer
    
    // Adicionar listener para a tecla E
    document.addEventListener('keydown', (event) => {
        if (event.code === 'KeyE') {
            updateInteractionSystem(); 
            console.log('DEBUG: tecla E, isNearKeyHalf:', isNearKeyHalf, 'currentKeyHalf:', currentKeyHalf, 'isNearTreasureChest:', isNearTreasureChest, 'collected:', collectedKeys.key1, collectedKeys.key2);
            
            // Primeiro verificar se está perto do baú e tem as chaves
            if (isNearTreasureChest && collectedKeys.key1 && collectedKeys.key2) {
                console.log('DEBUG: Tentando abrir o baú com as chaves');
                // Esconder a mensagem de interação
                hideInteractionMessage();
                // Mostrar a tela de final
                showBlackScreen();
                
                // Calcular e salvar o tempo de conclusão
                const endTime = performance.now();
                const completionTime = (endTime - startTime) / 1000; // Converter para segundos
                saveCompletionTime(completionTime);
                
                // Sair do modo de jogo (pointer lock)
                if (document.pointerLockElement) {
                    document.exitPointerLock();
                }
                
                // Esconder após 5 segundos e voltar para a tela inicial
                setTimeout(() => {
                    hideBlackScreen();
                    // Limpar a cena
                    clearScene();
                    // Mostrar a tela inicial
                    document.getElementById('start-screen').style.display = 'flex';
                    // Esconder os controles do jogo
                    document.getElementById('game-controls').style.display = 'none';
                    // Atualizar o ranking
                    updateRankingDisplay();
                    // Gerar uma nova cidade pré-gerada
                    generateInitialCity();
                }, 5000);
            }
            // Depois verificar se está perto de uma chave
            else if (isNearKeyHalf && currentKeyHalf) {
                console.log('DEBUG: Tentando coletar chave');
                collectKeyHalf(currentKeyHalf);
            }
        }
    });
    
    // Adicionar listener para o botão de batota
    document.getElementById('collectAllKeysBtn').addEventListener('click', collectAllKeys);
}

// Atualizar sistema de interação
function updateInteractionSystem() {
    checkProximity();
}

// Exportar funções
window.initInteractionSystem = initInteractionSystem;
window.updateInteractionSystem = updateInteractionSystem; 