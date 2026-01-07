package com.tictactoe.dto;

public class ChatMessage {
    private String player;
    private String message;
    private long timestamp;

    public ChatMessage() {}

    public ChatMessage(String player, String message, long timestamp) {
        this.player = player;
        this.message = message;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getPlayer() { return player; }
    public void setPlayer(String player) { this.player = player; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}