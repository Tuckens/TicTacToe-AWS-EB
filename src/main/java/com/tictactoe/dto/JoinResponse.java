package com.tictactoe.dto;

public class JoinResponse {
    private boolean isSpectator;
    private String role;

    public JoinResponse(boolean isSpectator, String role) {
        this.isSpectator = isSpectator;
        this.role = role;
    }

    public boolean isSpectator() { return isSpectator; }
    public String getRole() { return role; }
}