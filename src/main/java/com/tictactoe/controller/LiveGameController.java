package com.tictactoe.controller;

import com.tictactoe.dto.GameResponse;
import com.tictactoe.dto.MoveRequest;
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

    @MessageMapping("/move/{gameId}")
    public void handleMove(@DestinationVariable String gameId, MoveRequest move) {
        Game game = gameService.getGame(gameId);

        if (game != null) {
            boolean success = game.makeMove(move.getRow(), move.getColumn());

            if (success) {
                // Instead of returning a value, we PUSH the update to all
                // subscribers of this specific game ID
                GameResponse response = new GameResponse(
                        gameId,
                        game.getBoard().getCells(),
                        game.getGameStatus(),
                        game.getCurrentPlayer().toString(),
                        null, // error
                        game.isPlayerXPresent(),
                        game.isPlayerOPresent(),
                        game.isPlayerXReady(),
                        game.isPlayerOReady()
                );
                messagingTemplate.convertAndSend("/topic/game/" + gameId, response);
            }
        }
    }
}