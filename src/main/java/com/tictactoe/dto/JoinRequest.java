package com.tictactoe.dto;

public class JoinRequest {
    private String player;
    private String sessionId;

    public String getPlayer() { return player; }
    public void setPlayer(String player) { this.player = player; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}