package com.tictactoe.dto;

public class MoveRequest {
    private int row;
    private int column;

    public MoveRequest() {}

    public int getRow() {
        return row;
    }

    public void setRow(int row) {
        this.row = row;
    }

    public int getColumn() {
        return column;
    }

    public void setColumn(int column) {
        this.column = column;
    }
}