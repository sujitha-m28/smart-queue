package com.trialroom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SmartTrialRoomApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartTrialRoomApplication.class, args);
    }
}
