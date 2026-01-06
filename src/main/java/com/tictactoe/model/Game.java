package com.tictactoe.model;

import com.tictactoe.service.AIPlayer; // Ensure this matches your package

public class Game {
    private Board board = new Board();
    private Player currentPlayer = Player.X;
    private GameStatus gameStatus = GameStatus.IN_PROGRESS;

    // Unified AI variables
    private boolean isAIMode = false;
    private final Player aiPlayer = Player.O;
    private final AIPlayer ai = new AIPlayer(); // Assuming you have an instance

    // Multiplayer Presence and Rematch
    private boolean playerXPresent = false;
    private boolean playerOPresent = false;
    private boolean playerXReady = false;
    private boolean playerOReady = false;

    public Game() { this(false); }

    public Game(boolean aiMode) {
        this.isAIMode = aiMode;
        this.playerXPresent = true; // Host is always X and present
        if (aiMode) {
            this.playerOPresent = true; // AI counts as Player O
        }
    }

    public boolean isReadyToStart() {
        if (this.isAIMode) return true;
        return this.playerXPresent && this.playerOPresent;
    }

    public void resetBoard() {
        this.board = new Board();
        this.gameStatus = GameStatus.IN_PROGRESS;
        this.currentPlayer = Player.X;
        this.playerXReady = false;
        this.playerOReady = false;
    }

    public boolean canMove(String playerSymbol) {
        if (isAIMode) return true;
        // Logic: Both must be present AND it must be that player's turn
        return isReadyToStart() && currentPlayer.toString().equals(playerSymbol);
    }

    public boolean makeMove(int row, int column) {
        if (gameStatus != GameStatus.IN_PROGRESS || !board.place(row, column, currentPlayer)) {
            return false;
        }

        processTurn();

        // AI Logic
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

        // Row/Col checks
        for (int i = 0; i < 3; i++) {
            if (cells[i][0] != ' ' && cells[i][0] == cells[i][1] && cells[i][1] == cells[i][2]) { setWinner(cells[i][0]); return; }
            if (cells[0][i] != ' ' && cells[0][i] == cells[1][i] && cells[1][i] == cells[2][i]) { setWinner(cells[0][i]); return; }
        }

        // Diagonal checks
        if (cells[1][1] != ' ') {
            if (cells[0][0] == cells[1][1] && cells[1][1] == cells[2][2]) { setWinner(cells[0][0]); return; }
            if (cells[0][2] == cells[1][1] && cells[1][1] == cells[2][0]) { setWinner(cells[0][2]); return; }
        }

        if (isBoardFull()) {
            gameStatus = GameStatus.DRAW;
        }
    }

    private boolean isBoardFull() {
        for (char[] row : board.getCells()) {
            for (char cell : row) { if (cell == ' ') return false; }
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

    // --- GETTERS AND SETTERS ---
    public GameStatus getGameStatus() { return gameStatus; }
    public Board getBoard() { return board; }
    public Player getCurrentPlayer() { return currentPlayer; }
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
}