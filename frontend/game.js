const BASE_URL = 'http://tictactoe-env.eba-hir2yshp.eu-central-1.elasticbeanstalk.com';
const API_URL = `${BASE_URL}/api/game`;

const winSound = new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3');

function playWinSound() {
    winSound.play().catch(() => console.log("Sound play blocked"));
}

let gameId = null;
let stompClient = null;
let playerRole = null;
let opponentJoined = false;
let currentTurn = 'X';

const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const identityText = document.getElementById('identity');
const rematchBtn = document.getElementById('rematchBtn');
const aiControl = document.getElementById('aiControl');

function connectWebSocket(id) {
    const socket = new SockJS(`${BASE_URL}/ws-tictactoe`);
    stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {
        statusText.textContent = "Connected! Waiting for opponent...";

        stompClient.subscribe(`/topic/game/${id}`, (message) => {
            const data = JSON.parse(message.body);
            updateUI(data);
        });

        stompClient.send(`/app/join/${id}`, {}, JSON.stringify({ player: playerRole }));

    }, (error) => {
        console.error("STOMP error", error);
        statusText.textContent = "Connection Error. Refresh or use HTTP.";
    });
}

async function newGame(forceAiOff = false) {
    const aiOn = forceAiOff ? false : document.getElementById('aiToggle').checked;
    try {
        const res = await fetch(`${API_URL}/new?aiMode=${aiOn}`, { method: 'POST' });
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        gameId = data.gameId;

        opponentJoined = aiOn;

        renderBoard(data.board);
        rematchBtn.style.display = 'none';
        statusText.textContent = aiOn ? "Playing against AI..." : "Waiting for friend...";
        enableBoard();
        return true;
    } catch (e) {
        statusText.textContent = "Server Error";
        console.error(e);
        return false;
    }
}

async function handleMove(r, c) {
    if (!gameId) return;

    if (playerRole) {
        if (!opponentJoined) {
            statusText.textContent = "Waiting for friend...";
            return;
        }
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
        body: JSON.stringify({ row: r, column: c })
    });
    const data = await res.json();
    renderBoard(data.board);
    updateUI(data);
}

function updateUI(data) {
    if (data.status.includes('WON') || data.status === 'DRAW') {
        statusText.textContent = data.status.replace('_', ' ');
        if (data.status.includes('WON')) playWinSound();
        disableBoard();
        if (playerRole) {
            rematchBtn.style.display = 'block';
            const readyCount = (data.playerXReady ? 1 : 0) + (data.playerOReady ? 1 : 0);
            rematchBtn.textContent = `Request Rematch (${readyCount}/2)`;
        }
    } else {
        statusText.textContent = opponentJoined ? `${data.currentPlayer}'s turn` : "Waiting for friend...";
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
            alert("Invite link copied!");
            btn.textContent = "Link Copied!";
            setTimeout(() => btn.textContent = originalText, 3000);
        }).catch(() => {
            prompt("Could not auto-copy. Copy this link manually:", link);
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
    opponentJoined = document.getElementById('aiToggle').checked;
    identityText.textContent = "";
    aiControl.style.display = 'flex';
    window.history.pushState({}, '', window.location.pathname);
    newGame();
};

rematchBtn.onclick = () => {
    if (stompClient) {
        stompClient.send(`/app/rematch/${gameId}`, {}, JSON.stringify({ player: playerRole }));
    }
};

cells.forEach(cell => {
    cell.onclick = () => handleMove(cell.dataset.row, cell.dataset.col);
});

window.onload = () => {
    const id = new URLSearchParams(window.location.search).get('gameId');
    if (id) {
        gameId = id;
        playerRole = 'O';
        identityText.textContent = "YOU ARE PLAYER O";
        aiControl.style.display = 'none';
        connectWebSocket(id);
        enableBoard();
    }
};