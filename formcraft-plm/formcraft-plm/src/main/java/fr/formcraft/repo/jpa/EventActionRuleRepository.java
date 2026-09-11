package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.EventActionRule;
import fr.formcraft.model.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventActionRuleRepository extends JpaRepository<EventActionRule, Long> {

    List<EventActionRule> findByEventTypeAndEnabledTrue(EventType eventType);

    List<EventActionRule> findAllByOrderByIdAsc();
}
