package fr.formcraft.web.controller;

import fr.formcraft.model.entity.AccessRule;
import fr.formcraft.model.enums.RuleEffect;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.sdk.access.AccessRuleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-facing endpoint for Customization Gate 4 (Access Manager-style): register a
 * role/action ACL rule without a schema migration or a Java code change.
 */
@RestController
@RequestMapping("/access-rules")
public class AccessRuleController {

    private final AccessRuleService accessRuleService;

    @Autowired
    public AccessRuleController(AccessRuleService accessRuleService) {
        this.accessRuleService = accessRuleService;
    }

    @GetMapping
    public ResponseEntity<List<AccessRule>> list() {
        return ResponseEntity.ok(accessRuleService.listRules());
    }

    @PostMapping
    public ResponseEntity<AccessRule> define(@Valid @RequestBody DefineAccessRuleRequest request) {
        AccessRule rule = new AccessRule();
        rule.setRole(request.role());
        rule.setActionKey(request.actionKey());
        rule.setEffect(request.effect());

        return ResponseEntity.status(HttpStatus.CREATED).body(accessRuleService.defineRule(rule));
    }

    public record DefineAccessRuleRequest(
            @NotNull UserRole role,
            @NotBlank String actionKey,
            @NotNull RuleEffect effect
    ) {}
}
