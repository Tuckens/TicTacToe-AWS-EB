package com.tictactoe.model;

public class Game {
    private Board board = new Board();
    private Player currentPlayer = Player.X;
    private GameStatus gameStatus = GameStatus.IN_PROGRESS;

    private boolean isAIMode = false;
    private final Player aiPlayer = Player.O;
    private final AIPlayer ai = new AIPlayer();

    // Multiplayer Presence and Rematch
    private boolean playerXPresent = false;
    private boolean playerOPresent = false;
    private boolean playerXReady = false;
    private boolean playerOReady = false;

    // Track player sessions for spectator mode
    private String playerXId = null;
    private String playerOId = null;

    // Starting player tracking for side swapping
    private Player startingPlayer = Player.X;

    public Game() { this(false); }

    public Game(boolean aiMode) {
        this.isAIMode = aiMode;
        this.playerXPresent = true;
        if (aiMode) {
            this.playerOPresent = true;
        }
    }

    public boolean isReadyToStart() {
        if (this.isAIMode) return true;
        return (playerXPresent && playerOPresent) || (!playerXPresent && !playerOPresent);
    }

    public void resetBoard() {
        this.board = new Board();
        this.gameStatus = GameStatus.IN_PROGRESS;

        // Swap starting player
        this.startingPlayer = (this.startingPlayer == Player.X) ? Player.O : Player.X;
        this.currentPlayer = this.startingPlayer;

        this.playerXReady = false;
        this.playerOReady = false;
    }

    public boolean canMove(String playerSymbol) {
        if (isAIMode) return true;
        if (playerSymbol == null) return true;

        return isReadyToStart() && currentPlayer.toString().equals(playerSymbol);
    }

    public boolean canJoinAsPlayer(String sessionId, Player player) {
        if (player == Player.X) {
            return playerXId == null || playerXId.equals(sessionId);
        } else {
            return playerOId == null || playerOId.equals(sessionId);
        }
    }

    public void assignPlayer(String sessionId, Player player) {
        if (player == Player.X && playerXId == null) {
            playerXId = sessionId;
        } else if (player == Player.O && playerOId == null) {
            playerOId = sessionId;
        }
    }

    public boolean isSpectator(String sessionId) {
        if (sessionId == null) return false;
        return !sessionId.equals(playerXId) && !sessionId.equals(playerOId);
    }

    public boolean makeMove(int row, int column, String playerSymbol) {
        if (!isReadyToStart()) {
            return false;
        }

        if (playerSymbol != null && !currentPlayer.toString().equals(playerSymbol)) {
            return false;
        }

        if (gameStatus != GameStatus.IN_PROGRESS || !board.place(row, column, currentPlayer)) {
            return false;
        }

        processTurn();

        if (gameStatus == GameStatus.IN_PROGRESS && isAIMode && currentPlayer == aiPlayer) {
            makeAIMove();
        }
        return true;
    }

    private void processTurn() {
        checkWinner();
        if (gameStatus == GameStatus.IN_PROGRESS) {
            switchPlayer();
        }
    }

    private void checkWinner() {
        char[][] cells = board.getCells();

        for (int i = 0; i < 3; i++) {
            if (cells[i][0] != ' ' && cells[i][0] == cells[i][1] && cells[i][1] == cells[i][2]) {
                setWinner(cells[i][0]);
                return;
            }
            if (cells[0][i] != ' ' && cells[0][i] == cells[1][i] && cells[1][i] == cells[2][i]) {
                setWinner(cells[0][i]);
                return;
            }
        }

        if (cells[1][1] != ' ') {
            if (cells[0][0] == cells[1][1] && cells[1][1] == cells[2][2]) {
                setWinner(cells[0][0]);
                return;
            }
            if (cells[0][2] == cells[1][1] && cells[1][1] == cells[2][0]) {
                setWinner(cells[0][2]);
                return;
            }
        }

        if (isBoardFull()) {
            gameStatus = GameStatus.DRAW;
        }
    }

    private boolean isBoardFull() {
        for (char[] row : board.getCells()) {
            for (char cell : row) {
                if (cell == ' ') return false;
            }
        }
        return true;
    }

    private void setWinner(char p) {
        gameStatus = (p == 'X') ? GameStatus.X_WON : GameStatus.O_WON;
    }

    private void switchPlayer() {
        currentPlayer = (currentPlayer == Player.X) ? Player.O : Player.X;
    }

    private void makeAIMove() {
        AIPlayer.Move aiMove = ai.getBestMove(board.getCells(), aiPlayer);
        if (aiMove != null) {
            board.place(aiMove.row, aiMove.col, currentPlayer);
            processTurn();
        }
    }

    // Getters and Setters
    public GameStatus getGameStatus() { return gameStatus; }
    public Board getBoard() { return board; }
    public Player getCurrentPlayer() { return currentPlayer; }
    public Player getStartingPlayer() { return startingPlayer; }
    public boolean isAiMode() { return isAIMode; }
    public void setAiMode(boolean aiMode) { this.isAIMode = aiMode; }
    public boolean isPlayerXPresent() { return playerXPresent; }
    public void setPlayerXPresent(boolean pX) { this.playerXPresent = pX; }
    public boolean isPlayerOPresent() { return playerOPresent; }
    public void setPlayerOPresent(boolean pO) { this.playerOPresent = pO; }
    public boolean isPlayerXReady() { return playerXReady; }
    public void setPlayerXReady(boolean ready) { this.playerXReady = ready; }
    public boolean isPlayerOReady() { return playerOReady; }
    public void setPlayerOReady(boolean ready) { this.playerOReady = ready; }
    public String getPlayerXId() { return playerXId; }
    public String getPlayerOId() { return playerOId; }
}