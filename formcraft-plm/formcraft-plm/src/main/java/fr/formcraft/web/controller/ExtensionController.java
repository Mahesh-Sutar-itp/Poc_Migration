package fr.formcraft.web.controller;

import fr.formcraft.sdk.workflow.ChangeRequestTransitionHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only registry of Customization Gate 1 (ITK-style) extensions currently deployed
 * on this instance. There is no "create" endpoint here on purpose — registering a new
 * handler is a code+deploy action, not a runtime configuration action (see Gate 2 /
 * {@link CustomAttributeController} for the config-driven equivalent).
 */
@RestController
@RequestMapping("/extensions")
public class ExtensionController {

    private final List<ChangeRequestTransitionHandler> changeRequestTransitionHandlers;

    @Autowired
    public ExtensionController(List<ChangeRequestTransitionHandler> changeRequestTransitionHandlers) {
        this.changeRequestTransitionHandlers = changeRequestTransitionHandlers;
    }

    @GetMapping("/change-request-transition-handlers")
    public ResponseEntity<List<ExtensionInfo>> listChangeRequestTransitionHandlers() {
        List<ExtensionInfo> handlers = changeRequestTransitionHandlers.stream()
                .map(h -> new ExtensionInfo(h.getClass().getSimpleName(), h.getClass().getPackageName()))
                .toList();
        return ResponseEntity.ok(handlers);
    }

    public record ExtensionInfo(String className, String packageName) {}
}
