package com.tictactoe.controller;

import com.tictactoe.dto.ChatMessage;
import com.tictactoe.dto.GameResponse;
import com.tictactoe.dto.MoveRequest;
import com.tictactoe.dto.JoinRequest;
import com.tictactoe.model.Game;
import com.tictactoe.model.Player;
import com.tictactoe.service.GameService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
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
            String sessionId = request.getSessionId();
            Player requestedPlayer = "X".equals(request.getPlayer()) ? Player.X : Player.O;

            // Check if this session can join as the player
            if (game.canJoinAsPlayer(sessionId, requestedPlayer)) {
                game.assignPlayer(sessionId, requestedPlayer);

                if (requestedPlayer == Player.X) {
                    game.setPlayerXPresent(true);
                } else {
                    game.setPlayerOPresent(true);
                }

                System.out.println("Player " + request.getPlayer() + " (Session: " + sessionId + ") joined session: " + gameId);
            } else {
                System.out.println("Session " + sessionId + " joined as spectator in game: " + gameId);
            }

            broadcastState(gameId, game);
        }
    }

    @MessageMapping("/move/{gameId}")
    public void handleMove(@DestinationVariable String gameId, MoveRequest move) {
        Game game = gameService.getGame(gameId);
        if (game != null) {
            String sessionId = move.getSessionId();


            if (!game.isSpectator(sessionId)) {
                boolean success = game.makeMove(move.getRow(), move.getColumn(), move.getPlayer());
                if (success) {
                    broadcastState(gameId, game);
                }
            } else {
                System.out.println("Spectator " + sessionId + " tried to make a move - blocked");
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

    @MessageMapping("/chat/{gameId}")
    @SendTo("/topic/game/{gameId}/chat")
    public ChatMessage handleChat(@DestinationVariable String gameId, ChatMessage message) {
        message.setTimestamp(System.currentTimeMillis());
        return message;
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
                game.isPlayerOReady(),
                game.getStartingPlayer().toString()
        );
        messagingTemplate.convertAndSend("/topic/game/" + gameId, response);
    }
}