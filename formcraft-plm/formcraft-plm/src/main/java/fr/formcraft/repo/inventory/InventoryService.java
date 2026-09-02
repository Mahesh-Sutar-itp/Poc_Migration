package fr.formcraft.repo.inventory;

import fr.formcraft.model.entity.StockLot;
import fr.formcraft.model.entity.StockMovement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface InventoryService {

    List<StockLot> getAllLots();

    List<StockLot> getLotsForProduct(Long productId);

    StockLot getLot(Long id);

    StockLot receiveLot(Long productId, String lotNumber, BigDecimal quantity, String unit,
                         LocalDate expiryDate, Long supplierId, String performedBy);

    StockMovement receiveIntoLot(Long lotId, BigDecimal quantity, String performedBy, String reference);

    StockMovement consume(Long lotId, BigDecimal quantity, String performedBy, String reference);

    StockMovement adjust(Long lotId, BigDecimal delta, String performedBy, String reference);

    List<StockMovement> getMovements(Long lotId);

    List<StockLot> getLowStock(BigDecimal threshold);

    BigDecimal getTotalOnHand(Long productId);
}
