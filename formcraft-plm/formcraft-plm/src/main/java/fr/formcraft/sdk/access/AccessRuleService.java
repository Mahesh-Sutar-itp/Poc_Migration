package fr.formcraft.sdk.access;

import fr.formcraft.model.entity.AccessRule;
import fr.formcraft.model.enums.UserRole;

import java.util.List;

/**
 * Customization Gate 4 (Access Manager-style): lets a client register role/action
 * ACL rules and have them enforced automatically, without a schema migration or a
 * core code change.
 */
public interface AccessRuleService {

    List<AccessRule> listRules();

    AccessRule defineRule(AccessRule rule);

    /** No matching rule => default allow; this is an additive override list, not a replacement authority. */
    boolean isAllowed(UserRole role, String actionKey);
}
