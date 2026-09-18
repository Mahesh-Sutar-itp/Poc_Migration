package fr.formcraft.repo.attributes.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

/**
 * Finds the customization repos sitting under {@code formcraft.customizations.root-path}
 * (e.g. the sibling Customs repo, one subfolder per client — {@code Customs/nordic-snacks}).
 * Generic on purpose: core never hardcodes a client name, it just looks at whatever
 * subfolders happen to exist at deploy time.
 */
@Component
public class CustomizationRepositoryLocator {

    private final Path rootPath;

    public CustomizationRepositoryLocator(
            @Value("${formcraft.customizations.root-path:../../../Customs}") String rootPath) {
        this.rootPath = Path.of(rootPath);
    }

    public List<Path> listCustomizationRepositories() {
        if (!Files.isDirectory(rootPath)) {
            return List.of();
        }
        try (Stream<Path> children = Files.list(rootPath)) {
            return children
                    .filter(Files::isDirectory)
                    .filter(path -> !path.getFileName().toString().startsWith("."))
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to list customization repos under " + rootPath, e);
        }
    }
}
