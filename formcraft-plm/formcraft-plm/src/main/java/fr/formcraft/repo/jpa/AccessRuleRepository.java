package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.AccessRule;
import fr.formcraft.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccessRuleRepository extends JpaRepository<AccessRule, Long> {

    Optional<AccessRule> findByRoleAndActionKey(UserRole role, String actionKey);
}
