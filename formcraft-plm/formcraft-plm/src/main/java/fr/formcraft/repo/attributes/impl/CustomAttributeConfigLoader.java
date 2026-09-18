package fr.formcraft.repo.attributes.impl;

import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.sdk.attributes.CustomAttributeService;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Applies Gate 2 custom attributes on startup by reading every customization repo's
 * {@code UI-product-attributes-config/product-attributes.json} — the client-owned,
 * declarative replacement for a hand-written {@code ApplicationRunner} per client.
 * Generic and client-agnostic: core has no idea which (if any) attributes it will find.
 * Idempotent, so re-running it on every restart is safe.
 */
@Component
public class CustomAttributeConfigLoader implements ApplicationRunner {

    private static final Log log = LogFactory.getLog(CustomAttributeConfigLoader.class);

    private final CustomAttributeService customAttributeService;
    private final ProductAttributeConfigFileSync configFileSync;

    public CustomAttributeConfigLoader(CustomAttributeService customAttributeService,
                                        ProductAttributeConfigFileSync configFileSync) {
        this.customAttributeService = customAttributeService;
        this.configFileSync = configFileSync;
    }

    @Override
    public void run(ApplicationArguments args) {
        Set<String> existingKeys = new HashSet<>();
        for (CustomAttributeDefinition def : customAttributeService.listDefinitions()) {
            existingKeys.add(def.getAttributeKey());
        }

        configFileSync.loadAll().forEach((key, entry) -> {
            if (existingKeys.contains(key)) {
                log.info("Custom attribute '" + key + "' already defined, skipping");
                return;
            }
            try {
                customAttributeService.defineAttribute(entry.toDefinition());
                log.info("Defined custom attribute '" + key + "' from customization config");
            } catch (Exception e) {
                log.error("Failed to define custom attribute '" + key + "' from customization config", e);
            }
        });
    }
}
