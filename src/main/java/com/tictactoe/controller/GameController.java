package com.tictactoe.controller;

import com.tictactoe.dto.GameResponse;
import com.tictactoe.dto.MoveRequest;
import com.tictactoe.model.Game;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private Map<String, Game> games = new ConcurrentHashMap<>();

    @PostMapping("/new")
    public GameResponse newGame() {
        String gameId = UUID.randomUUID().toString();
        Game game = new Game();
        games.put(gameId, game);

        return new GameResponse(
                gameId,
                game.getBoard().getCells(),
                game.getGameStatus(),
                game.getCurrentPlayer().toString(),
                null
        );
    }

    @PostMapping("/{gameId}/move")
    public GameResponse makeMove(@PathVariable String gameId, @RequestBody MoveRequest move) {
        Game game = games.get(gameId);
        if(game == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found");
        }

        boolean success = game.makeMove(move.getRow(), move.getColumn());

        return new GameResponse(
                gameId,
                game.getBoard().getCells(),
                game.getGameStatus(),
                game.getCurrentPlayer().toString(),
                success ? null : "Invalid move"
        );
    }

    @GetMapping("/{gameId}")
    public GameResponse getGame(@PathVariable String gameId) {
        Game game = games.get(gameId);
        if(game == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Game not found");
        }

        return new GameResponse(
                gameId,
                game.getBoard().getCells(),
                game.getGameStatus(),
                game.getCurrentPlayer().toString(),
                null
        );
    }
}