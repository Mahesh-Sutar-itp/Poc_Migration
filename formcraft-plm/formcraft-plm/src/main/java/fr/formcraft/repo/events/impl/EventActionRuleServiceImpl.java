package fr.formcraft.repo.events.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.EventActionRule;
import fr.formcraft.model.enums.EventActionType;
import fr.formcraft.model.enums.EventType;
import fr.formcraft.repo.jpa.EventActionRuleRepository;
import fr.formcraft.repo.notification.NotificationService;
import fr.formcraft.sdk.events.EventActionRuleService;
import fr.formcraft.sdk.events.EventContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("eventActionRuleService")
public class EventActionRuleServiceImpl implements EventActionRuleService {

    private final EventActionRuleRepository repository;
    private final NotificationService notificationService;

    @Autowired
    public EventActionRuleServiceImpl(EventActionRuleRepository repository, NotificationService notificationService) {
        this.repository = repository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventActionRule> listRules() {
        return repository.findAllByOrderByIdAsc();
    }

    @Override
    @Transactional
    public EventActionRule createRule(EventActionRule rule) {
        return repository.save(rule);
    }

    @Override
    @Transactional
    public EventActionRule setEnabled(Long id, boolean enabled) {
        EventActionRule rule = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("EventActionRule", id));
        rule.setEnabled(enabled);
        return repository.save(rule);
    }

    @Override
    @Transactional
    public void deleteRule(Long id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional
    public void fire(EventType type, EventContext context) {
        List<EventActionRule> rules = repository.findByEventTypeAndEnabledTrue(type);
        for (EventActionRule rule : rules) {
            if (rule.getConditionProductType() != null
                    && context.product() != null
                    && rule.getConditionProductType() != context.product().getProductType()) {
                continue;
            }

            String message = rule.getMessageTemplate()
                    .replace("{title}", nullToEmpty(context.title()))
                    .replace("{detail}", nullToEmpty(context.detail()));

            if (rule.getActionType() == EventActionType.NOTIFY_ROLE) {
                notificationService.notifyRole(rule.getTargetRole(), rule.getNotificationTitle(),
                        message, context.link(), rule.getNotificationCategory());
            } else if (rule.getActionType() == EventActionType.NOTIFY_INITIATING_USER
                    && context.initiatingUsername() != null) {
                notificationService.notifyUser(context.initiatingUsername(), rule.getNotificationTitle(),
                        message, context.link(), rule.getNotificationCategory());
            }
        }
    }

    private static String nullToEmpty(String value) {
        return value != null ? value : "";
    }
}
