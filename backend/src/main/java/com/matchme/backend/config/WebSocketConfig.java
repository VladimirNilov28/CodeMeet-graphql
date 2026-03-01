package com.matchme.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Topic prefix for users to subscribe to (e.g. /topic/messages)
        config.enableSimpleBroker("/user", "/topic");
        // Prefix for application endpoints (e.g. sending a message via /app/chat)
        config.setApplicationDestinationPrefixes("/app");
        // Used to send messages to specific users
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // The endpoint clients will connect to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // allow all for dev
                .withSockJS(); // Fallback
    }
}
