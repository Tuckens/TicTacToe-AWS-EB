package com.tictactoe.service;

import com.tictactoe.model.Game;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    // This is the "Single Source of Truth
    private final Map<String, Game> games = new ConcurrentHashMap<>();

    public void saveGame(String gameId, Game game) {
        games.put(gameId, game);
    }

    public Game getGame(String gameId) {
        return games.get(gameId);
    }

    public void deleteGame(String gameId) {
        games.remove(gameId);
    }
}