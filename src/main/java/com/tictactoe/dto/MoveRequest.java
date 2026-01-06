package com.tictactoe.dto;

public class MoveRequest {
    private int row;
    private int column;
    private String player; // This is the "symbol" (X or O)

    public MoveRequest() {}

    // Getters and Setters
    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }

    public int getColumn() { return column; }
    public void setColumn(int column) { this.column = column; }

    public String getPlayer() { return player; }
    public void setPlayer(String player) { this.player = player; }
}