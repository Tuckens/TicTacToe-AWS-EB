package com.tictactoe.model;

public class AIPlayer {

    public static class Move {
        public int row;
        public int col;

        public Move(int row, int col) {
            this.row = row;
            this.col = col;
        }
    }

    private Player aiPlayer;
    private Player humanPlayer;

    public Move getBestMove(char[][] board, Player aiPlayer) {
        this.aiPlayer = aiPlayer;
        this.humanPlayer = (aiPlayer == Player.X) ? Player.O : Player.X;

        int bestScore = Integer.MIN_VALUE;
        Move bestMove = null;

        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (board[r][c] == ' ') {
                    board[r][c] = getChar(aiPlayer);

                    int score = minimax(board, 0, false);
                    board[r][c] = ' ';

                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = new Move(r, c);
                    }
                }
            }
        }
        return bestMove;
    }

    private int minimax(char[][] board, int depth, boolean isMaximizing) {
        GameStatus result = checkWinner(board);


        if (result == GameStatus.X_WON) {
            return aiPlayer == Player.X ? 10 - depth : depth - 10;
        }
        if (result == GameStatus.O_WON) {
            return aiPlayer == Player.O ? 10 - depth : depth - 10;
        }
        if (result == GameStatus.DRAW) {
            return 0;
        }

        if (isMaximizing) {
            int bestScore = Integer.MIN_VALUE;
            for (int r = 0; r < 3; r++) {
                for (int c = 0; c < 3; c++) {
                    if (board[r][c] == ' ') {
                        board[r][c] = getChar(aiPlayer);
                        int score = minimax(board, depth + 1, false);
                        board[r][c] = ' ';
                        bestScore = Math.max(score, bestScore);
                    }
                }
            }
            return bestScore;
        } else {
            int bestScore = Integer.MAX_VALUE;
            for (int r = 0; r < 3; r++) {
                for (int c = 0; c < 3; c++) {
                    if (board[r][c] == ' ') {
                        board[r][c] = getChar(humanPlayer);
                        int score = minimax(board, depth + 1, true);
                        board[r][c] = ' ';
                        bestScore = Math.min(score, bestScore);
                    }
                }
            }
            return bestScore;
        }
    }

    private GameStatus checkWinner(char[][] board) {
        // Rows and Columns
        for (int i = 0; i < 3; i++) {
            if (board[i][0] != ' ' && board[i][0] == board[i][1] && board[i][1] == board[i][2])
                return board[i][0] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
            if (board[0][i] != ' ' && board[0][i] == board[1][i] && board[1][i] == board[2][i])
                return board[0][i] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
        }

        // Diagonals
        if (board[0][0] != ' ' && board[0][0] == board[1][1] && board[1][1] == board[2][2])
            return board[0][0] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
        if (board[0][2] != ' ' && board[0][2] == board[1][1] && board[1][1] == board[2][0])
            return board[0][2] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;

        // Draw/Progress check
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (board[r][c] == ' ') return GameStatus.IN_PROGRESS;
            }
        }
        return GameStatus.DRAW;
    }

    private char getChar(Player player) {
        return player == Player.X ? 'X' : 'O';
    }
}