const BASE_URL = 'http://tictactoe-env.eba-hir2yshp.eu-central-1.elasticbeanstalk.com';
const API_URL = `${BASE_URL}/api/game`;

const winSound = new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3');

function playWinSound() {
    winSound.play().catch(() => console.log("Sound play blocked"));
}

const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

let gameId = null;
let stompClient = null;
let playerRole = null;
let opponentJoined = false;
let currentTurn = 'X';
let gameEnded = false;
let rematchRequested = false;
let isSpectator = false;
let wasOAlreadyPresent = false;

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const identityText = document.getElementById('identity');
const rematchBtn = document.getElementById('rematchBtn');
const aiControl = document.getElementById('aiControl');
const chatBox = document.getElementById('chatBox');
const chatInput = document.getElementById('chatInput');
const chatContainer = document.getElementById('chatContainer');
const sendBtn = document.getElementById('sendBtn');

function connectWebSocket(id) {
    const socket = new SockJS(`${BASE_URL}/ws-tictactoe`);
    stompClient = Stomp.over(socket);
    let messageCount = 0;

    stompClient.connect({}, () => {
        statusText.textContent = "Connected!";

        stompClient.subscribe(`/topic/game/${id}`, (message) => {
            const data = JSON.parse(message.body);
            messageCount++;

            if (messageCount === 1) {
                if (playerRole === 'O' && data.playerXPresent && data.playerOPresent) {
                    if (wasOAlreadyPresent) {
                        isSpectator = true;
                        playerRole = 'Spectator';
                        identityText.textContent = "👁️ SPECTATOR MODE";
                        statusText.textContent = "Both player slots are full";
                    }
                }
            }

            if (playerRole === 'X') {
                opponentJoined = data.playerOPresent;
            } else if (playerRole === 'O' && !isSpectator) {
                opponentJoined = data.playerXPresent;
            }

            currentTurn = data.currentPlayer;
            renderBoard(data.board);
            updateUI(data);
        });

        stompClient.subscribe(`/topic/game/${id}/chat`, (message) => {
            const chatMsg = JSON.parse(message.body);
            displayChatMessage(chatMsg);
        });

        stompClient.send(`/app/join/${id}`, {}, JSON.stringify({
            player: isSpectator ? 'Spectator' : playerRole,
            sessionId: sessionId
        }));

        chatContainer.style.display = 'block';
    }, (error) => {
        statusText.textContent = "❌ Connection Error";
    });
}

async function newGame(forceAiOff = false) {
    const aiOn = forceAiOff ? false : document.getElementById('aiToggle').checked;
    try {
        const res = await fetch(`${API_URL}/new?aiMode=${aiOn}`, { method: 'POST' });
        const data = await res.json();
        gameId = data.gameId;
        gameEnded = false;
        rematchRequested = false;
        isSpectator = false;
        opponentJoined = !playerRole;

        renderBoard(data.board);
        updateUI(data);
        return true;
    } catch (e) {
        statusText.textContent = "❌ Server Error";
        return false;
    }
}

async function handleMove(r, c) {
    if (!gameId || gameEnded) return;

    if (playerRole) {
        if (isSpectator || !opponentJoined || playerRole !== currentTurn) return;

        stompClient.send(`/app/move/${gameId}`, {}, JSON.stringify({
            row: parseInt(r),
            column: parseInt(c),
            player: playerRole
        }));
    } else {
        // Hotseat Move
        try {
            const res = await fetch(`${API_URL}/${gameId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ row: parseInt(r), column: parseInt(c), player: null })
            });
            const data = await res.json();
            renderBoard(data.board);
            updateUI(data);
        } catch (e) { console.error(e); }
    }
}

function updateUI(data) {
    const isGameOver = data.status.endsWith('_WON') || data.status === 'DRAW';
    const isGameInProgress = data.status === 'IN_PROGRESS';

    if (isGameOver) {
        const statusMap = { 'X_WON': '🎉 X Wins!', 'O_WON': '🎉 O Wins!', 'DRAW': '🤝 Draw!' };
        statusText.textContent = statusMap[data.status];
        if (data.status !== 'DRAW') playWinSound();
        gameEnded = true;
        if (playerRole && !isSpectator) {
            rematchBtn.style.display = 'block';
            rematchBtn.textContent = `Request Rematch (${(data.playerXReady ? 1 : 0) + (data.playerOReady ? 1 : 0)}/2)`;
        }
    } else {
        rematchBtn.style.display = 'none';
        if (playerRole) {
            statusText.textContent = isSpectator ? `Spectating - ${data.currentPlayer}'s turn` :
                                     (opponentJoined ? `${data.currentPlayer}'s turn` : "⏳ Waiting for opponent...");
        } else {
            statusText.textContent = `${data.currentPlayer}'s turn`;
        }
    }
}

function renderBoard(board) {
    cells.forEach((cell, i) => {
        const val = board[Math.floor(i/3)][i%3];
        cell.textContent = val === ' ' ? '' : val;
        cell.className = `cell ${val.toLowerCase()}`;
    });
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && stompClient?.connected) {
        stompClient.send(`/app/chat/${gameId}`, {}, JSON.stringify({
            player: isSpectator ? 'Spectator' : `Player ${playerRole}`,
            message: message
        }));
        chatInput.value = '';
    }
}

function displayChatMessage(chatMsg) {
    const msgDiv = document.createElement('div');
    const isOwn = (isSpectator && chatMsg.player === 'Spectator') || chatMsg.player === `Player ${playerRole}`;
    msgDiv.className = isOwn ? 'chat-message own' : 'chat-message';
    msgDiv.innerHTML = `<div class="chat-player">${chatMsg.player}:</div><div class="chat-text">${chatMsg.message}</div>`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('inviteBtn').onclick = async function() {
    const btn = this;
    const originalText = btn.textContent;

    btn.textContent = "Generating...";

    const success = await newGame(true);

    if (success && gameId) {

        playerRole = 'X';
        isSpectator = false;
        identityText.textContent = "YOU ARE PLAYER X";
        aiControl.style.display = 'none';


        const link = `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;
        window.history.pushState({ gameId: gameId }, '', link);


        connectWebSocket(gameId);


        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(link).then(() => {
                alert("✅ Invite link copied! Share it with your friend.");
                btn.textContent = "Link Copied!";
                setTimeout(() => btn.textContent = originalText, 3000);
            });
        } else {
            prompt("Copy this link manually:", link);
            btn.textContent = originalText;
        }
    } else {
        btn.textContent = "Error!";
        setTimeout(() => btn.textContent = originalText, 2000);
    }
};

document.getElementById('newGame').onclick = async () => {
    playerRole = null;
    identityText.textContent = "";
    aiControl.style.display = 'flex';
    chatContainer.style.display = 'none';
    chatBox.innerHTML = '';
    window.history.pushState({}, '', window.location.pathname);
    await newGame();
};

rematchBtn.onclick = () => {
    if (stompClient?.connected && !isSpectator) {
        stompClient.send(`/app/rematch/${gameId}`, {}, JSON.stringify({ player: playerRole }));
    }
};

sendBtn.onclick = sendChatMessage;
chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage(); };
cells.forEach(cell => cell.onclick = () => handleMove(cell.dataset.row, cell.dataset.col));

window.onload = async () => {
    const id = new URLSearchParams(window.location.search).get('gameId');
    if (id) {
        gameId = id;
        try {
            const res = await fetch(`${API_URL}/${id}/state`);
            const state = await res.json();
            if (state.playerOPresent) {
                isSpectator = true; wasOAlreadyPresent = true;
                playerRole = 'Spectator'; identityText.textContent = "👁️ SPECTATOR MODE";
            } else {
                playerRole = 'O'; identityText.textContent = "YOU ARE PLAYER O";
            }
        } catch (e) { playerRole = 'O'; }
        aiControl.style.display = 'none';
        connectWebSocket(id);
    } else {
        await newGame();
    }
};

(function() {
    const header = document.getElementById('chatHeader');
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    header.onmousedown = (e) => {
        p3 = e.clientX; p4 = e.clientY;
        document.onmouseup = () => document.onmousemove = null;
        document.onmousemove = (e) => {
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX; p4 = e.clientY;
            chatContainer.style.top = (chatContainer.offsetTop - p2) + "px";
            chatContainer.style.left = (chatContainer.offsetLeft - p1) + "px";
        };
    };
})();