package fr.formcraft;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * FormCraft PLM — Main application entry point.
 *
 * <p>A complex Spring Boot monolith for Product Lifecycle Management,
 * mirroring beCPG's service/interface architecture for AWS Transform POC.</p>
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class FormCraftApplication {

    public static void main(String[] args) {
        SpringApplication.run(FormCraftApplication.class, args);
    }
}
