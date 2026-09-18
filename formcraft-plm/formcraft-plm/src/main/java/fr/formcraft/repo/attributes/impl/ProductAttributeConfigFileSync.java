package fr.formcraft.repo.attributes.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.CollectionType;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.CustomAttributeDefinition;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads and writes each customization repo's {@code UI-product-attributes-config/product-attributes.json}
 * — the declarative, client-owned record of Gate 2 custom attributes. Core owns this
 * class (it's generic, not client-specific); the JSON content itself belongs to the
 * customization repo it lives in.
 */
@Component
public class ProductAttributeConfigFileSync {

    private static final Log log = LogFactory.getLog(ProductAttributeConfigFileSync.class);

    static final String CONFIG_DIR_NAME = "UI-product-attributes-config";
    static final String CONFIG_FILE_NAME = "product-attributes.json";

    private final CustomizationRepositoryLocator repositoryLocator;
    private final ObjectMapper objectMapper;

    public ProductAttributeConfigFileSync(CustomizationRepositoryLocator repositoryLocator, ObjectMapper objectMapper) {
        this.repositoryLocator = repositoryLocator;
        this.objectMapper = objectMapper;
    }

    /**
     * Reads every customization repo's config file, keyed by attribute key. If more
     * than one repo defines the same key, the last one listed wins.
     */
    public Map<String, CustomAttributeConfigEntry> loadAll() {
        Map<String, CustomAttributeConfigEntry> entries = new LinkedHashMap<>();
        for (Path repo : repositoryLocator.listCustomizationRepositories()) {
            Path file = configFile(repo);
            try {
                for (CustomAttributeConfigEntry entry : readConfigFile(file)) {
                    entries.put(entry.attributeKey(), entry);
                }
            } catch (FormCraftException e) {
                log.error("Skipping unreadable customization config file " + file, e);
            }
        }
        return entries;
    }

    /**
     * Writes {@code definition} into every customization repo's config file (creating
     * the {@value #CONFIG_DIR_NAME} folder and/or the file itself if absent), replacing
     * any existing entry with the same attribute key.
     */
    public void upsert(CustomAttributeDefinition definition) {
        List<Path> repos = repositoryLocator.listCustomizationRepositories();
        if (repos.isEmpty()) {
            log.info("No customization repo found under the configured root path — "
                    + "'" + definition.getAttributeKey() + "' was not written to a config file");
            return;
        }

        CustomAttributeConfigEntry entry = CustomAttributeConfigEntry.from(definition);
        for (Path repo : repos) {
            Path file = configFile(repo);
            List<CustomAttributeConfigEntry> existing = new ArrayList<>(readConfigFile(file));
            existing.removeIf(e -> e.attributeKey().equals(entry.attributeKey()));
            existing.add(entry);
            writeConfigFile(file, existing);
        }
    }

    private Path configFile(Path repo) {
        return repo.resolve(CONFIG_DIR_NAME).resolve(CONFIG_FILE_NAME);
    }

    private List<CustomAttributeConfigEntry> readConfigFile(Path file) {
        try {
            if (!Files.isRegularFile(file) || Files.size(file) == 0) {
                return List.of();
            }
            CollectionType listType = objectMapper.getTypeFactory()
                    .constructCollectionType(List.class, CustomAttributeConfigEntry.class);
            return objectMapper.readValue(file.toFile(), listType);
        } catch (IOException e) {
            throw new FormCraftException("Failed to read customization config file " + file, e);
        }
    }

    /**
     * Writes via a temp file + atomic move so a process killed mid-write can never
     * leave a truncated/corrupt config file behind.
     */
    private void writeConfigFile(Path file, List<CustomAttributeConfigEntry> entries) {
        try {
            Files.createDirectories(file.getParent());
            Path tempFile = Files.createTempFile(file.getParent(), CONFIG_FILE_NAME, ".tmp");
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(tempFile.toFile(), entries);
            Files.move(tempFile, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write customization config file " + file, e);
        }
    }
}
