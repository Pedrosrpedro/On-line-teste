// =======================================================
// SETUP INICIAL DO JOGO
// =======================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const PLAYER_SIZE = 20;

let playerStates = {}; // Objeto para guardar a posição de todos os jogadores
let myPlayerId;        // Variável para guardar nosso próprio ID
let conn;              // Variável para guardar a conexão ativa com outro jogador

// =======================================================
// LÓGICA DO PEERJS PARA MULTIPLAYER
// =======================================================

// 1. Cria uma nova instância do Peer.
// A biblioteca PeerJS usa um servidor de sinalização público gratuito para
// ajudar os jogadores a se encontrarem.
const peer = new Peer();

// 2. Quando o PeerJS se conecta ao servidor e nos dá um ID único.
peer.on('open', (id) => {
    console.log('Meu ID de peer é: ' + id);
    myPlayerId = id;
    document.getElementById('my-id').textContent = id; // Mostra nosso ID na tela

    // Cria nosso próprio jogador localmente
    playerStates[myPlayerId] = {
        x: Math.floor(Math.random() * (canvas.width - PLAYER_SIZE)),
        y: Math.floor(Math.random() * (canvas.height - PLAYER_SIZE)),
        color: 'blue' // Nosso jogador é azul
    };
});

// 3. Quando outro jogador tenta se conectar CONOSCO.
peer.on('connection', (connection) => {
    console.log('Um jogador se conectou a nós!');
    conn = connection;
    setupConnectionEvents(); // Configura os eventos para essa nova conexão
});

// 4. Quando NÓS clicamos no botão para nos conectarmos a outro jogador.
document.getElementById('connect-btn').onclick = () => {
    const otherId = document.getElementById('other-id').value;
    if (otherId) {
        console.log('Tentando conectar ao ID: ' + otherId);
        conn = peer.connect(otherId); // Inicia a conexão
        setupConnectionEvents();
    }
};

/**
 * Função central que define o que fazer quando a conexão é estabelecida
 * e quando recebemos dados do outro jogador.
 */
function setupConnectionEvents() {
    // É chamado quando a conexão é bem-sucedida e está pronta para uso
    conn.on('open', () => {
        console.log("Conexão estabelecida com sucesso!");
        // Envia nosso estado inicial para o outro jogador, para que ele possa nos ver
        const myState = { id: myPlayerId, ...playerStates[myPlayerId] };
        conn.send(myState);
    });

    // É chamado toda vez que recebemos uma mensagem do outro jogador
    conn.on('data', (data) => {
        // Se for um jogador que ainda não conhecemos, adicione-o
        if (!playerStates[data.id]) {
            playerStates[data.id] = { ...data, color: 'red' }; // O outro jogador é vermelho
            console.log("Recebi dados de um novo jogador:", data.id);
            
            // Importante: envia nosso estado de volta, caso ele ainda não nos tenha
            const myState = { id: myPlayerId, ...playerStates[myPlayerId] };
            conn.send(myState);
        } else { // Se já o conhecemos, apenas atualizamos sua posição
            playerStates[data.id] = { ...playerStates[data.id], ...data };
        }
    });
}


// =======================================================
// LÓGICA DO JOGO (DESENHO E MOVIMENTO)
// =======================================================

// Função de desenho que roda em loop
function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha cada jogador na sua respectiva posição
    for (const id in playerStates) {
        const player = playerStates[id];
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    requestAnimationFrame(draw); // Pede ao navegador para chamar draw() novamente no próximo frame
}

// Inicia o loop de desenho
draw();

// Ouve por eventos de teclado
document.addEventListener('keydown', (e) => {
    const player = playerStates[myPlayerId];
    if (!player) return; // Não faz nada se nosso jogador ainda não foi criado

    const speed = 10;
    if (e.key === 'ArrowUp') player.y -= speed;
    if (e.key === 'ArrowDown') player.y += speed;
    if (e.key === 'ArrowLeft') player.x -= speed;
    if (e.key === 'ArrowRight') player.x += speed;

    // Se a conexão existir e estiver aberta, envia nosso novo estado
    if (conn && conn.open) {
        const myState = { id: myPlayerId, ...player };
        conn.send(myState);
    }
});
