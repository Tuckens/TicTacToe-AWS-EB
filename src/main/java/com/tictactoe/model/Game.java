package com.tictactoe.model;

public class Game {
    private final Board board = new Board();
    private Player currentPlayer = Player.X;
    private GameStatus gameStatus = GameStatus.IN_PROGRESS;
    private boolean isAIMode = false;
    private Player aiPlayer = Player.O;
    private AIPlayer ai = new AIPlayer();


    public boolean makeMove(int row, int column) {
        if (gameStatus != GameStatus.IN_PROGRESS || !board.place(row, column, currentPlayer)) {
            return false;
        }

        processTurn();

        if(gameStatus == GameStatus.IN_PROGRESS && isAIMode && currentPlayer == aiPlayer) {
            makeAIMove();
        }
        return true;

    }

    private void processTurn() {
        board.print();
        checkWinner();
        if(gameStatus == GameStatus.IN_PROGRESS) {
            switchPlayer();
        }
    }

    private void checkWinner() {
        char[][] cells = board.getCells();

        // Check rows
        for (int r = 0; r < 3; r++) {
            if (cells[r][0] != ' ' && cells[r][0] == cells[r][1] && cells[r][1] == cells[r][2]) {
                setWinner(cells[r][0]);
                return;
            }
        }

        // Check columns
        for (int c = 0; c < 3; c++) {
            if (cells[0][c] != ' ' && cells[0][c] == cells[1][c] && cells[1][c] == cells[2][c]) {
                setWinner(cells[0][c]);
                return;
            }
        }

        // Check diagonal (top-left to bottom-right)
        if (cells[0][0] != ' ' && cells[0][0] == cells[1][1] && cells[1][1] == cells[2][2]) {
            setWinner(cells[0][0]);
            return;
        }

        // Check diagonal (top-right to bottom-left)
        if (cells[0][2] != ' ' && cells[0][2] == cells[1][1] && cells[1][1] == cells[2][0]) {
            setWinner(cells[0][2]);
            return;
        }

        if (isBoardFull()) {
            gameStatus = GameStatus.DRAW;
            System.out.println("It's a DRAW");
        }
    }


    private boolean isBoardFull() {
        char[][] cells = board.getCells();
        for (int r = 0; r < 3; r++) {
            for (int c = 0; c < 3; c++) {
                if (cells[r][c] == ' ') return false;
            }
        }
        return true;
    }

    private void setWinner(char player) {
        if (player == 'X') {
            gameStatus = GameStatus.X_WON;
            System.out.println("X won");
        } else if (player == 'O') {
            gameStatus = GameStatus.O_WON;
            System.out.println("O won");
        }
    }

    private void switchPlayer() {
        currentPlayer = (currentPlayer == Player.X) ? Player.O : Player.X;
    }

    public GameStatus getGameStatus() {
        return gameStatus;
    }

    public Board getBoard() {
        return board;
    }

    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    public Game() {
        this(false);
    }

    public Game(boolean aiMode) {
        this.isAIMode = aiMode;
    }


    public boolean isAiMode() {
        return isAIMode;
    }

    private void makeAIMove() {
        AIPlayer.Move aiMove = ai.getBestMove(board.getCells(), aiPlayer);
        if(aiMove!= null) {
            board.place(aiMove.row, aiMove.col, currentPlayer);
            processTurn();
        }
    }

}

