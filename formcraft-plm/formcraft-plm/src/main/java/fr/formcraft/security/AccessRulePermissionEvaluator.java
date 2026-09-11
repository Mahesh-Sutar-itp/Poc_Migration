package fr.formcraft.security;

import fr.formcraft.model.enums.UserRole;
import fr.formcraft.sdk.access.AccessRuleService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.io.Serializable;

/**
 * Customization Gate 4 (Access Manager-style) activation point: backs the
 * {@code hasPermission(...)} SpEL function used by {@code @PreAuthorize} on
 * policy-checked service methods, delegating the actual role/action decision
 * to the DB-backed {@link AccessRuleService}.
 */
@Component
public class AccessRulePermissionEvaluator implements PermissionEvaluator {

    private final AccessRuleService accessRuleService;

    public AccessRulePermissionEvaluator(AccessRuleService accessRuleService) {
        this.accessRuleService = accessRuleService;
    }

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        UserRole role = extractRole(authentication);
        return accessRuleService.isAllowed(role, permission.toString());
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        return hasPermission(authentication, null, permission);
    }

    private UserRole extractRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> UserRole.valueOf(authority.substring(5)))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("No role on principal"));
    }
}
