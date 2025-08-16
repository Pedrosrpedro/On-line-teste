const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const PLAYER_SIZE = 20;

let playerStates = {};
let myPlayerId;
let conn; // A conexão

// 1. Cria um novo Peer. O servidor público da PeerJS fará a sinalização!
const peer = new Peer();

// Quando o PeerJS nos dá um ID
peer.on('open', (id) => {
    myPlayerId = id;
    document.getElementById('my-id').textContent = id;
    playerStates[myPlayerId] = {
        x: Math.random() * 780,
        y: Math.random() * 580,
        color: 'blue'
    };
});

// Quando alguém tenta se conectar a nós
peer.on('connection', (connection) => {
    conn = connection;
    setupConnectionEvents();
});

// Quando clicamos no botão para conectar a outra pessoa
document.getElementById('connect-btn').onclick = () => {
    const otherId = document.getElementById('other-id').value;
    conn = peer.connect(otherId);
    setupConnectionEvents();
};

function setupConnectionEvents() {
    conn.on('open', () => {
        console.log("Conexão estabelecida!");
        // Envia nosso estado inicial para o outro jogador
        conn.send({ id: myPlayerId, ...playerStates[myPlayerId] });
    });

    // Quando recebemos dados
    conn.on('data', (data) => {
        // Se for um jogador novo, adicione-o
        if (!playerStates[data.id]) {
            playerStates[data.id] = { ...data, color: 'red' };
            // Envia nosso estado de volta para que ele possa nos ver
            conn.send({ id: myPlayerId, ...playerStates[myPlayerId] });
        } else { // Se não, apenas atualize
            playerStates[data.id] = { ...playerStates[data.id], ...data };
        }
    });
}

// Lógica do jogo
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const id in playerStates) {
        const player = playerStates[id];
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
    }
    requestAnimationFrame(draw);
}
draw();

document.addEventListener('keydown', (e) => {
    const player = playerStates[myPlayerId];
    if (!player) return;
    const speed = 10;
    if (e.key === 'ArrowUp') player.y -= speed;
    if (e.key === 'ArrowDown') player.y += speed;
    if (e.key === 'ArrowLeft') player.x -= speed;
    if (e.key === 'ArrowRight') player.x += speed;

    // Envia o novo estado se a conexão existir e estiver aberta
    if (conn && conn.open) {
        conn.send({ id: myPlayerId, ...player });
    }
});
