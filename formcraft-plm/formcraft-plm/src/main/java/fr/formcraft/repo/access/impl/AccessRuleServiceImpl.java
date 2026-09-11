package fr.formcraft.repo.access.impl;

import fr.formcraft.model.entity.AccessRule;
import fr.formcraft.model.enums.RuleEffect;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.jpa.AccessRuleRepository;
import fr.formcraft.sdk.access.AccessRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("accessRuleService")
public class AccessRuleServiceImpl implements AccessRuleService {

    private final AccessRuleRepository accessRuleRepository;

    @Autowired
    public AccessRuleServiceImpl(AccessRuleRepository accessRuleRepository) {
        this.accessRuleRepository = accessRuleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccessRule> listRules() {
        return accessRuleRepository.findAll();
    }

    @Override
    @Transactional
    public AccessRule defineRule(AccessRule rule) {
        return accessRuleRepository.save(rule);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isAllowed(UserRole role, String actionKey) {
        return accessRuleRepository.findByRoleAndActionKey(role, actionKey)
                .map(rule -> rule.getEffect() == RuleEffect.ALLOW)
                .orElse(true);
    }
}
