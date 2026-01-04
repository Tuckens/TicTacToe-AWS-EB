package com.tictactoe.dto;

import com.tictactoe.model.GameStatus;


public class GameResponse {
    private String gameId;
    private char[][] board;
    private GameStatus status;
    private String currentPlayer;
    private String error;

    public GameResponse(String gameId, char[][] board, GameStatus status, String currentPlayer, String error) {
        this.gameId = gameId;
        this.board = board;
        this.status = status;
        this.currentPlayer = currentPlayer;
        this.error = error;
    }

    // Getters
    public String getGameId() { return gameId; }
    public char[][] getBoard() { return board; }
    public GameStatus getStatus() { return status; }
    public String getCurrentPlayer() { return currentPlayer; }
    public String getError() { return error; }
}