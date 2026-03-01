package com.matchme.backend.controller;

import com.matchme.backend.dto.MessageDto;
import com.matchme.backend.model.Connection;
import com.matchme.backend.model.ConnectionStatus;
import com.matchme.backend.model.Message;
import com.matchme.backend.model.User;
import com.matchme.backend.repository.ConnectionRepository;
import com.matchme.backend.repository.MessageRepository;
import com.matchme.backend.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(MessageRepository messageRepository, UserRepository userRepository, ConnectionRepository connectionRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
        this.messagingTemplate = messagingTemplate;
    }

    // --- WebSocket Endpoints ---

    // Expected destination mapping: /app/chat
    @MessageMapping("/chat")
    public void processMessage(@Payload MessageDto chatMessage, Principal principal) {
        
        // 1. Get sender via token/Principal 
        // Principal is available in STOMP if security is configured cleanly.
        // For now, assume chatMessage brings senderId or we use Principal name (Email)
        String senderEmail = principal.getName();
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sender not found"));

        User recipient = userRepository.findById(chatMessage.getRecipientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        // 2. Validate connection exists
        connectionRepository.findConnectionBetweenUsers(sender, recipient, ConnectionStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not connected with this user"));

        // 3. Save message
        Message message = new Message();
        message.setSender(sender);
        message.setRecipient(recipient);
        message.setContent(chatMessage.getContent());
        Message savedMessage = messageRepository.save(message);

        // 4. Map to Dto and broadcast
        MessageDto mapped = mapToDto(savedMessage);

        // Send to queue specific to the user. E.g. /user/{recipientId}/queue/messages
        // Use the users unique user identifier to push notifications
        messagingTemplate.convertAndSendToUser(
                recipient.getId().toString(), "/queue/messages", mapped
        );
        
        // Optionally echo back to the sender
        messagingTemplate.convertAndSendToUser(
                 sender.getId().toString(), "/queue/messages", mapped
        );
    }


    // --- REST Endpoints for History & Initialization  ---

    @GetMapping("/history/{partnerId}")
    public ResponseEntity<Page<MessageDto>> getChatHistory(
            @PathVariable UUID partnerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        User currentUser = getCurrentUser(authentication);
        User partner = userRepository.findById(partnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Must be connected
        connectionRepository.findConnectionBetweenUsers(currentUser, partner, ConnectionStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not connected with this user"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> history = messageRepository.findChatHistory(currentUser, partner, pageable);

        Page<MessageDto> response = history.map(this::mapToDto);
        return ResponseEntity.ok(response);
    }
    
    // Quick REST endpoint for standard messaging (if user defaults outside WS)
    @PostMapping("/send/{recipientId}")
    public ResponseEntity<MessageDto> sendRestMessage(
            @PathVariable UUID recipientId, 
            @RequestBody Map<String, String> body, 
            Authentication authentication) {

          User sender = getCurrentUser(authentication);
          User recipient = userRepository.findById(recipientId)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

          connectionRepository.findConnectionBetweenUsers(sender, recipient, ConnectionStatus.ACCEPTED)
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not connected with this user"));

          Message message = new Message();
          message.setSender(sender);
          message.setRecipient(recipient);
          message.setContent(body.get("content"));
          Message savedMessage = messageRepository.save(message);

          MessageDto dto = mapToDto(savedMessage);

          // Broadcast to connected WS sessions
          messagingTemplate.convertAndSendToUser(
                  recipient.getId().toString(), "/queue/messages", dto
          );

          return ResponseEntity.ok(dto);
    }

    // Get Active Chats overview
    @GetMapping("/partners")
    public ResponseEntity<List<Map<String, Object>>> getChatPartners(Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        List<UUID> partnerIds = messageRepository.findActiveChatPartners(currentUser.getId());
        
        List<Map<String, Object>> response = partnerIds.stream().map(id -> {
            User p = userRepository.findById(id).orElse(null);
            if (p != null) {
                // Get unread counts
                long unreadCount = messageRepository.countUnreadMessages(p, currentUser);
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", p.getId().toString());
                map.put("name", p.getName() != null ? p.getName() : "Unknown User");
                map.put("unreadCount", unreadCount);
                return map;
            }
            return null;
        }).filter(java.util.Objects::nonNull).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/read/{senderId}")
    public ResponseEntity<String> markAsRead(@PathVariable UUID senderId, Authentication authentication) {
        User currentUser = getCurrentUser(authentication);
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<Message> unreads = messageRepository.findBySenderAndRecipientAndIsReadFalse(sender, currentUser);
        for(Message m : unreads) {
            m.setRead(true);
        }
        messageRepository.saveAll(unreads);
        return ResponseEntity.ok("Marked as read");
    }


    private MessageDto mapToDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .recipientId(message.getRecipient().getId())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .isRead(message.isRead())
                .build();
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
