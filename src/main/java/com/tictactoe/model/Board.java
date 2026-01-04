package com.tictactoe.model;

public class Board {
    private final char[][] cells = new char[3][3];


    public Board() {
        for(int r=0; r<3; r++) {
            for(int c=0; c<3; c++) {
                cells[r][c] = ' ';
            }
        }
    }

    public boolean place(int row, int column, Player player) {
        if(cells[row][column] != ' ') {
            System.out.println("Wrong move!");
            print();
            return false;
        }
        else {
            cells[row][column] = player == Player.X ? 'X' : 'O';
            return true;
        }

    }

    public char [][] getCells() {
        return cells;
    }

    public void print() {
        for(int r = 0; r < 3; r++) {
            for(int c = 0; c < 3; c++) {
                System.out.print("[" + cells[r][c] + "]"); // Wrap in brackets
            }
            System.out.println(); // New line after each row
        }
        System.out.println(); // Separator between boards
    }

}
