package com.tictactoe.controller;

import com.tictactoe.dto.GameResponse;
import com.tictactoe.dto.MoveRequest;
import com.tictactoe.dto.JoinRequest;
import com.tictactoe.model.Game;
import com.tictactoe.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class LiveGameController {

    private final GameService gameService;
    private final SimpMessagingTemplate messagingTemplate;

    public LiveGameController(GameService gameService, SimpMessagingTemplate messagingTemplate) {
        this.gameService = gameService;
        this.messagingTemplate = messagingTemplate;
    }


    @MessageMapping("/join/{gameId}")
    public void handleJoin(@DestinationVariable String gameId, JoinRequest request) {
        Game game = gameService.getGame(gameId);
        if (game != null) {
            if ("X".equals(request.getPlayer())) {
                game.setPlayerXPresent(true);
            } else if ("O".equals(request.getPlayer())) {
                game.setPlayerOPresent(true);
            }

            System.out.println("Player " + request.getPlayer() + " joined session: " + gameId);

            broadcastState(gameId, game);
        }
    }

    @MessageMapping("/move/{gameId}")
    public void handleMove(@DestinationVariable String gameId, MoveRequest move) {
        Game game = gameService.getGame(gameId);
        if (game != null) {
            // This calls public boolean makeMove(int row, int column, String playerSymbol)
            boolean success = game.makeMove(move.getRow(), move.getColumn(), move.getPlayer());

            if (success) {
                broadcastState(gameId, game);
            }
        }
    }


    @MessageMapping("/rematch/{gameId}")
    public void handleRematch(@DestinationVariable String gameId, JoinRequest request) {
        Game game = gameService.getGame(gameId);
        if (game != null) {
            if ("X".equals(request.getPlayer())) game.setPlayerXReady(true);
            if ("O".equals(request.getPlayer())) game.setPlayerOReady(true);

            if (game.isPlayerXReady() && game.isPlayerOReady()) {
                game.resetBoard();
            }
            broadcastState(gameId, game);
        }
    }


    private void broadcastState(String gameId, Game game) {
        GameResponse response = new GameResponse(
                gameId,
                game.getBoard().getCells(),
                game.getGameStatus(),
                game.getCurrentPlayer().toString(),
                null,
                game.isPlayerXPresent(),
                game.isPlayerOPresent(),
                game.isPlayerXReady(),
                game.isPlayerOReady()
        );
        messagingTemplate.convertAndSend("/topic/game/" + gameId, response);
    }
}