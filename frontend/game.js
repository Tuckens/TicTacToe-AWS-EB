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
        console.log("WebSocket connected!");
        console.log("My sessionId:", sessionId);
        console.log("Trying to join as:", playerRole);
        statusText.textContent = "Connected!";

       stompClient.subscribe(`/topic/game/${id}`, (message) => {
           const data = JSON.parse(message.body);
           messageCount++;

           if (messageCount === 1) {

               if (playerRole === 'O' && data.playerXPresent && data.playerOPresent) {

                   if (wasOAlreadyPresent) {
                       console.log("Slot was already taken. Switching to Spectator.");
                       isSpectator = true;
                       playerRole = 'Spectator';
                       identityText.textContent = "👁️ SPECTATOR MODE";
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


        if (!playerRole) {
            opponentJoined = true;
        } else {
            opponentJoined = false;
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
        if (isSpectator) return;
        if (!opponentJoined) return;
        if (playerRole !== currentTurn) return;

        if (stompClient && stompClient.connected) {
            stompClient.send(`/app/move/${gameId}`, {}, JSON.stringify({
                row: parseInt(r),
                column: parseInt(c),
                player: playerRole
            }));
        }
        return;
    }


    const res = await fetch(`${API_URL}/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            row: r,
            column: c,
            player: null
        })
    });
    const data = await res.json();
    renderBoard(data.board);
    updateUI(data);
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


    if (gameEnded && rematchRequested && isGameInProgress && !data.playerXReady && !data.playerOReady && !isSpectator) {
        console.log("Rematch started - roles stay the same, turn order swaps");

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
        let displayName;
        if (isSpectator) {
            displayName = "Spectator";
        } else {
            displayName = `Player ${playerRole}`;
        }

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

window.onload = async () => {
    const id = new URLSearchParams(window.location.search).get('gameId');
    if (id) {
        gameId = id;

        try {

            const response = await fetch(`${API_URL}/${id}/state`);
            const currentState = await response.json();


            if (currentState.playerOPresent) {
                wasOAlreadyPresent = true;
                isSpectator = true;
                playerRole = 'Spectator';
                identityText.textContent = "👁️ SPECTATOR MODE";
            } else {
                wasOAlreadyPresent = false;
                playerRole = 'O';
                identityText.textContent = "YOU ARE PLAYER O";
            }
        } catch (e) {
            console.log("Could not pre-fetch game state, defaulting to Player O");
            playerRole = 'O';
        }

        aiControl.style.display = 'none';
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