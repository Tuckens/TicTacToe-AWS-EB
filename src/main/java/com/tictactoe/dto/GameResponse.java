package com.tictactoe.dto;

import com.tictactoe.model.GameStatus;

public class GameResponse {
    private String gameId;
    private char[][] board;
    private GameStatus status;
    private String currentPlayer;
    private String error;


    private boolean playerXPresent;
    private boolean playerOPresent;
    private boolean playerXReady;
    private boolean playerOReady;


    public GameResponse(String gameId, char[][] board, GameStatus status, String currentPlayer,
                        String error, boolean playerXPresent, boolean playerOPresent,
                        boolean playerXReady, boolean playerOReady) {
        this.gameId = gameId;
        this.board = board;
        this.status = status;
        this.currentPlayer = currentPlayer;
        this.error = error;
        this.playerXPresent = playerXPresent;
        this.playerOPresent = playerOPresent;
        this.playerXReady = playerXReady;
        this.playerOReady = playerOReady;
    }

    // Getters
    public String getGameId() { return gameId; }
    public char[][] getBoard() { return board; }
    public GameStatus getStatus() { return status; }
    public String getCurrentPlayer() { return currentPlayer; }
    public String getError() { return error; }
    public boolean isPlayerXPresent() { return playerXPresent; }
    public boolean isPlayerOPresent() { return playerOPresent; }
    public boolean isPlayerXReady() { return playerXReady; }
    public boolean isPlayerOReady() { return playerOReady; }
}