package com.safetrip.dto;

public class AssistantChatResponse {
    private String reply;
    private String role = "assistant";

    public AssistantChatResponse() {
    }

    public AssistantChatResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
