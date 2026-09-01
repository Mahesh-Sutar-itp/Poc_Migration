package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByStockLotIdOrderByPerformedAtDesc(Long stockLotId);
}
