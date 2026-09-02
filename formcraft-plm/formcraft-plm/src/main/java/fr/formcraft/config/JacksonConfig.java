package fr.formcraft.config;

import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Registers Hibernate6Module so Jackson can safely serialize lazy entity associations.
 * Without it, an uninitialized @ManyToOne proxy crashes serialization with
 * "Type definition error: [simple type, class org.hibernate.proxy.pojo.bytebuddy.ByteBuddyInterceptor]".
 * FORCE_LAZY_LOADING is enabled so exposed nested associations (e.g. CompositionLine.ingredient,
 * NonConformance.product) are resolved on demand within the open Hibernate session (OSIV is on),
 * matching what the frontend expects from those DTOs.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Hibernate6Module hibernate6Module() {
        Hibernate6Module module = new Hibernate6Module();
        module.enable(Hibernate6Module.Feature.FORCE_LAZY_LOADING);
        return module;
    }
}
