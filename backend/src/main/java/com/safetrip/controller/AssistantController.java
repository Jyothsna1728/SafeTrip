package com.safetrip.controller;

import com.safetrip.dto.ApiResponse;
import com.safetrip.dto.AssistantChatRequest;
import com.safetrip.dto.AssistantChatResponse;
import com.safetrip.service.AiAssistantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    @Autowired
    private AiAssistantService assistantService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AssistantChatResponse>> chat(@Valid @RequestBody AssistantChatRequest request) {
        AssistantChatResponse response = assistantService.chat(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
