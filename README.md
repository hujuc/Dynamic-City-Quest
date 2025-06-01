# Dynamic City Quest

## Gerador de Cidade Procedural 3D

Dynamic City Quest é um sistema interativo de geração e exploração de cidades 3D, desenvolvido com Three.js. Permite criar layouts urbanos únicos, com terreno e edifícios gerados proceduralmente, recursos ambientais dinâmicos, e interação em primeira pessoa com mini-jogos. A experiência combina criação de cenários, navegação imersiva e desafios de exploração!

## Demo

A versão mais recente do projeto está disponível para teste em: <a href="https://hujuc.github.io/Dynamic-City-Quest/" target="_blank">https://hujuc.github.io/Dynamic-City-Quest/</a>

## Funcionalidades Implementadas

- **Geração Procedural de Cidades:** Configure parâmetros como tamanho, densidade, altura máxima dos edifícios, relevo, lagos, parques e vegetação. Cada mundo é único!

- **Exploração Imersiva:** Modo primeira pessoa, voo livre e vista aérea panorâmica.

- **Terreno Adaptativo:** Terreno pode ser plano ou montanhoso, ajustável via sliders. Ruas, lagos e parques adaptam-se automaticamente ao relevo.

- **Edifícios Dinâmicos:** Arquitetura variada, sistema de LOD (Level of Detail), fundações automáticas, detalhes realistas como janelas, varandas e chaminés.

- **Ambiente Vivo:** Parques, árvores de várias espécies, lagos com pedras, chuva opcional e ciclo dia/noite contínuo.

- **Mini-jogo de Exploração:** Encontre duas metades de uma chave, desbloqueie o baú do tesouro no centro da cidade e vença o jogo! (E tente bater os seus recordes de tempo no ranking!)

- **UI Moderna:** Tela inicial com painel central e controlos organizados para configurar a cidade antes de começar.

- **Otimização:** Sistema LOD para manter alta performance, mesmo em cidades grandes.


## Experiência do Utilizador
- Ao aceder, aparece uma cidade 3D já renderizada ao fundo.
- No centro da tela está o painel de configuração. Defina parâmetros como o tamanho da cidade, relevo, número de árvores, intensidade da chuva, etc.
- Clique em Gerar Cidade e o painel desaparece e começa a exploração.
- Mova-se com **WASD**, olhe ao redor com o rato, e alterne entre modos de câmara. Toque no **ESC** para sair no modo de navegação.
- Procure as metades da chave para desbloquear o baú do tesouro!
- Descubra parques, lagos e edifícios únicos, tudo adaptado ao terreno e diferente em cada mundo.

##  Instalação e Execução Local
```sh
git clone https://github.com/hujuc/Dynamic-City-Quest.git
cd Dynamic-City-Quest
```
Basta abrir index.html num browser moderno (Chrome/Firefox/Edge).


## Tecnologias Utilizadas
- Three.js para renderização e lógica 3D
- JavaScript puro (ES6) para lógica do sistema
- HTML5 e CSS3 para a interface do utilizador

## Autoria
Projeto desenvolvido por [Hugo Castro](https://github.com/hujuc)

Baseado no proposal: Dynamic City Quest – Geração Procedural e Exploração de Cidades Virtuais

