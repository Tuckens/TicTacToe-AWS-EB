const BASE_URL = 'http://tictactoe-env.eba-hir2yshp.eu-central-1.elasticbeanstalk.com';
const API_URL = `${BASE_URL}/api/game`;

const winSound = new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3');

function playWinSound() {
    winSound.play().catch(() => console.log("Sound play blocked"));
}

// Generate unique session ID for this browser tab
const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);

let gameId = null;
let stompClient = null;
let playerRole = null;
let opponentJoined = false;
let currentTurn = 'X';
let gameEnded = false;
let rematchRequested = false;
let isSpectator = false;

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

    let firstUpdate = true;

    stompClient.connect({}, () => {
        console.log("WebSocket connected!");
        statusText.textContent = "Connected!";

        stompClient.subscribe(`/topic/game/${id}`, (message) => {
            console.log("Received message:", message.body);
            const data = JSON.parse(message.body);

            if (firstUpdate) {
                firstUpdate = false;


                if (playerRole === 'X') {
                    identityText.textContent = "YOU ARE PLAYER X";
                } else if (playerRole === 'O') {
                    identityText.textContent = "YOU ARE PLAYER O";
                }


                setTimeout(() => {
                    if (playerRole === 'O' && !opponentJoined) {

                        console.log("O slot was already filled - becoming spectator");
                        isSpectator = true;
                        playerRole = 'Spectator';
                        identityText.textContent = "👁️ SPECTATOR MODE";
                        statusText.textContent = "Both player slots are full - spectating";
                        disableBoard();
                    }
                }, 300);
            }

            if (!isSpectator) {
                if (playerRole === 'X') {
                    opponentJoined = data.playerOPresent;
                } else if (playerRole === 'O') {
                    opponentJoined = data.playerXPresent;
                }
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
            player: playerRole === 'Spectator' ? 'O' : playerRole,
            sessionId: sessionId
        }));

        chatContainer.style.display = 'block';

    }, (error) => {
        console.error("STOMP error:", error);
        statusText.textContent = "❌ Connection Error. Try refreshing.";
    });
}
async function newGame(forceAiOff = false) {
    const aiOn = forceAiOff ? false : document.getElementById('aiToggle').checked;
    try {
        const res = await fetch(`${API_URL}/new?aiMode=${aiOn}`, { method: 'POST' });
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        gameId = data.gameId;

        // For local games, always set opponentJoined to true
        if (!playerRole) {
            opponentJoined = true; // Local game (AI or hot-seat)
        } else {
            opponentJoined = false; // Multiplayer - wait for opponent
        }

        gameEnded = false;
        rematchRequested = false;
        isSpectator = false;

        renderBoard(data.board);
        rematchBtn.style.display = 'none';

        if (playerRole) {
            statusText.textContent = "Waiting for opponent...";
        } else if (aiOn) {
            statusText.textContent = `${data.currentPlayer}'s turn`;
        } else {
            statusText.textContent = `${data.currentPlayer}'s turn (Pass & Play)`;
        }

        enableBoard();
        return true;
    } catch (e) {
        statusText.textContent = "❌ Server Error";
        console.error(e);
        return false;
    }
}

async function handleMove(r, c) {
    if (!gameId) return;

    if (playerRole) {
        if (isSpectator) {
            statusText.textContent = "👁️ You are spectating - cannot make moves";
            return;
        }

        if (!opponentJoined) {
            statusText.textContent = "⏳ Waiting for opponent to join...";
            return;
        }
        if (playerRole !== currentTurn) {
            statusText.textContent = `It's ${currentTurn}'s turn!`;
            return;
        }

        if (stompClient && stompClient.connected) {
            console.log("Sending move:", r, c, "as player:", playerRole);
            stompClient.send(`/app/move/${gameId}`, {}, JSON.stringify({
                row: parseInt(r),
                column: parseInt(c),
                player: playerRole,
                sessionId: sessionId
            }));
        }
        return;
    }

    const res = await fetch(`${API_URL}/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row: r, column: c, player: null })
    });
    const data = await res.json();
    renderBoard(data.board);
    updateUI(data);
}

function updateUI(data) {
    console.log("Updating UI with:", data);

    const isGameOver = data.status === 'X_WON' || data.status === 'O_WON' || data.status === 'DRAW';
    const isGameInProgress = data.status === 'IN_PROGRESS';


    if (gameEnded && rematchRequested && isGameInProgress && !data.playerXReady && !data.playerOReady) {
        console.log("Rematch completed! Swapping roles...");

        if (playerRole === 'X') {
            playerRole = 'O';
            identityText.textContent = "YOU ARE PLAYER O";
        } else if (playerRole === 'O') {
            playerRole = 'X';
            identityText.textContent = "YOU ARE PLAYER X";
        }
        gameEnded = false;
        rematchRequested = false;
    }

    if (isGameOver) {
        const statusMap = {
            'X_WON': '🎉 X Wins!',
            'O_WON': '🎉 O Wins!',
            'DRAW': '🤝 Draw!'
        };
        statusText.textContent = statusMap[data.status];

        if (data.status !== 'DRAW') {
            playWinSound();
        }

        disableBoard();
        gameEnded = true;

        if (playerRole && !isSpectator) {
            rematchBtn.style.display = 'block';
            const readyCount = (data.playerXReady ? 1 : 0) + (data.playerOReady ? 1 : 0);
            rematchBtn.textContent = `Request Rematch (${readyCount}/2)`;
        }
    } else if (isGameInProgress) {
        rematchBtn.style.display = 'none';

        if (playerRole) {
            if (isSpectator) {
                statusText.textContent = `Spectating - ${data.currentPlayer}'s turn`;
            } else if (opponentJoined) {
                statusText.textContent = `${data.currentPlayer}'s turn`;
            } else {
                statusText.textContent = "⏳ Waiting for opponent to join...";
            }
        } else {
            statusText.textContent = `${data.currentPlayer}'s turn`;
        }

        if (!isSpectator) {
            enableBoard();
        }
    }
}

function renderBoard(board) {
    cells.forEach((cell, i) => {
        const val = board[Math.floor(i/3)][i%3];
        cell.textContent = val === ' ' ? '' : val;
        cell.className = `cell ${val.toLowerCase()}`;
        cell.disabled = (val !== ' ');
    });
}

function enableBoard() {
    cells.forEach(c => c.disabled = false);
}

function disableBoard() {
    cells.forEach(c => c.disabled = true);
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && stompClient && stompClient.connected) {
        const displayName = isSpectator ? 'Spectator' : `Player ${playerRole}`;
        stompClient.send(`/app/chat/${gameId}`, {}, JSON.stringify({
            player: displayName,
            message: message
        }));
        chatInput.value = '';
    }
}

function displayChatMessage(chatMsg) {
    const msgDiv = document.createElement('div');

    const isOwnMessage = (isSpectator && chatMsg.player === 'Spectator') ||
                         (!isSpectator && chatMsg.player === `Player ${playerRole}`);

    msgDiv.className = isOwnMessage ? 'chat-message own' : 'chat-message';

    const playerDiv = document.createElement('div');
    playerDiv.className = 'chat-player';
    playerDiv.textContent = `${chatMsg.player}:`;

    const textDiv = document.createElement('div');
    textDiv.className = 'chat-text';
    textDiv.textContent = chatMsg.message;

    msgDiv.appendChild(playerDiv);
    msgDiv.appendChild(textDiv);
    chatBox.appendChild(msgDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((res, rej) => {
            document.execCommand('copy') ? res() : rej();
            textArea.remove();
        });
    }
}

document.getElementById('inviteBtn').onclick = async function() {
    const btn = this;
    const originalText = btn.textContent;

    btn.textContent = "Generating...";
    const success = await newGame(true);

    if (success && gameId) {
        playerRole = 'X';
        identityText.textContent = "YOU ARE PLAYER X";
        aiControl.style.display = 'none';

        const link = `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;
        window.history.pushState({}, '', link);

        copyToClipboard(link).then(() => {
            alert("✅ Invite link copied! Share it with your friend.");
            btn.textContent = "Link Copied!";
            setTimeout(() => btn.textContent = originalText, 3000);
        }).catch(() => {
            prompt("Copy this link manually:", link);
            btn.textContent = originalText;
        });

        connectWebSocket(gameId);
    } else {
        btn.textContent = "Error!";
        setTimeout(() => btn.textContent = originalText, 2000);
    }
};

document.getElementById('newGame').onclick = () => {
    playerRole = null;
    opponentJoined = true;
    identityText.textContent = "";
    aiControl.style.display = 'flex';
    chatContainer.style.display = 'none';
    chatBox.innerHTML = '';
    window.history.pushState({}, '', window.location.pathname);
    gameEnded = false;
    rematchRequested = false;
    isSpectator = false;
    newGame();
};

rematchBtn.onclick = () => {
    if (stompClient && stompClient.connected && !isSpectator) {
        rematchRequested = true;
        stompClient.send(`/app/rematch/${gameId}`, {}, JSON.stringify({ player: playerRole }));
    }
};

sendBtn.onclick = sendChatMessage;

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

cells.forEach(cell => {
    cell.onclick = () => handleMove(cell.dataset.row, cell.dataset.col);
});

window.onload = () => {
    const id = new URLSearchParams(window.location.search).get('gameId');
    if (id) {
        gameId = id;
        playerRole = 'O';
        identityText.textContent = "Connecting as Player O...";
        aiControl.style.display = 'none';
        statusText.textContent = "Connecting...";
        gameEnded = false;
        rematchRequested = false;
        isSpectator = false;
        connectWebSocket(id);

    }
};

// DRAG
(function() {
    const header = document.getElementById('chatHeader');
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        chatContainer.style.top = (chatContainer.offsetTop - pos2) + "px";
        chatContainer.style.left = (chatContainer.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
})();