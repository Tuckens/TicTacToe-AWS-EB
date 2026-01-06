package com.tictactoe.model;

public class AIPlayer {

    public static class Move {
        public int row;
        public int col;
        public int score;

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

        // Try all possible moves
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (board[r][c] == ' ') {
                    // Make the move
                    board[r][c] = getChar(aiPlayer);

                    // Calculate score using minimax
                    int score = minimax(board, 0, false);

                    // Undo the move
                    board[r][c] = ' ';

                    // Update best move
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = new Move(r, c);
                    }
                }
            }
        }

        return bestMove;
    }

    /**
     * Minimax algorithm with alpha-beta pruning
     * @param board Current board state
     * @param depth Current depth in the game tree
     * @param isMaximizing True if AI's turn, false if human's turn
     * @return Best score for this position
     */

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
            // AI's turn - maximize score
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
            // Human's turn - minimize score
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
        // Check rows
        for (int r = 0; r < 3; r++) {
            if (board[r][0] != ' ' && board[r][0] == board[r][1] && board[r][1] == board[r][2]) {
                return board[r][0] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
            }
        }

        // Check columns
        for (int c = 0; c < 3; c++) {
            if (board[0][c] != ' ' && board[0][c] == board[1][c] && board[1][c] == board[2][c]) {
                return board[0][c] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
            }
        }

        // Check diagonals
        if (board[0][0] != ' ' && board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
            return board[0][0] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
        }
        if (board[0][2] != ' ' && board[0][2] == board[1][1] && board[1][1] == board[2][0]) {
            return board[0][2] == 'X' ? GameStatus.X_WON : GameStatus.O_WON;
        }

        // Check for draw
        boolean isFull = true;
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (board[r][c] == ' ') {
                    isFull = false;
                    break;
                }
            }
        }

        return isFull ? GameStatus.DRAW : GameStatus.IN_PROGRESS;
    }

    private char getChar(Player player) {
        return player == Player.X ? 'X' : 'O';
    }
}