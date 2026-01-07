package com.tictactoe.controller;

import com.tictactoe.dto.GameResponse;
import com.tictactoe.dto.MoveRequest;
import com.tictactoe.model.Game;
import com.tictactoe.service.GameService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/new")
    public GameResponse newGame(@RequestParam(required = false, defaultValue = "false") boolean aiMode) {
        String gameId = UUID.randomUUID().toString();
        Game game = new Game(aiMode);
        gameService.saveGame(gameId, game);

        return createResponse(gameId, game, null);
    }

    @PostMapping("/{gameId}/move")
    public GameResponse makeMove(@PathVariable String gameId, @RequestBody MoveRequest move) {
        Game game = gameService.getGame(gameId);
        if (game == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found");
        }

        boolean success = game.makeMove(move.getRow(), move.getColumn(), move.getPlayer());

        return createResponse(gameId, game, success ? null : "Invalid move");
    }

    @GetMapping("/{gameId}")
    public GameResponse getGame(@PathVariable String gameId) {
        Game game = gameService.getGame(gameId);
        if (game == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found");
        }

        return createResponse(gameId, game, null);
    }


    private GameResponse createResponse(String gameId, Game game, String error) {
        return new GameResponse(
                gameId,
                game.getBoard().getCells(),
                game.getGameStatus(),
                game.getCurrentPlayer().toString(),
                error,
                game.isPlayerXPresent(),
                game.isPlayerOPresent(),
                game.isPlayerXReady(),
                game.isPlayerOReady(),
                game.getStartingPlayer().toString()
        );
    }
}