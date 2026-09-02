package fr.formcraft.repo.inventory.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.StockLot;
import fr.formcraft.model.entity.StockMovement;
import fr.formcraft.model.entity.Supplier;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.StockMovementType;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.StockLotRepository;
import fr.formcraft.repo.jpa.StockMovementRepository;
import fr.formcraft.repo.jpa.SupplierRepository;
import fr.formcraft.repo.inventory.InventoryService;
import fr.formcraft.repo.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service("inventoryService")
public class InventoryServiceImpl implements InventoryService {

    private static final BigDecimal DEFAULT_LOW_STOCK_THRESHOLD = BigDecimal.valueOf(30);

    private final StockLotRepository stockLotRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final NotificationService notificationService;

    @Autowired
    public InventoryServiceImpl(StockLotRepository stockLotRepository,
                                 StockMovementRepository stockMovementRepository,
                                 ProductRepository productRepository,
                                 SupplierRepository supplierRepository,
                                 NotificationService notificationService) {
        this.stockLotRepository = stockLotRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLot> getAllLots() {
        return stockLotRepository.findAllWithDetails();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLot> getLotsForProduct(Long productId) {
        return stockLotRepository.findByProductId(productId);
    }

    @Override
    @Transactional(readOnly = true)
    public StockLot getLot(Long id) {
        return stockLotRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("StockLot", id));
    }

    @Override
    @Transactional
    public StockLot receiveLot(Long productId, String lotNumber, BigDecimal quantity, String unit,
                                LocalDate expiryDate, Long supplierId, String performedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        StockLot lot = new StockLot();
        lot.setProduct(product);
        lot.setLotNumber(lotNumber);
        lot.setQuantityOnHand(quantity);
        lot.setUnit(unit);
        lot.setExpiryDate(expiryDate);
        lot.setStatus("ACTIVE");

        if (supplierId != null) {
            Supplier supplier = supplierRepository.findById(supplierId)
                    .orElseThrow(() -> new EntityNotFoundException("Supplier", supplierId));
            lot.setSupplier(supplier);
        }

        StockLot saved = stockLotRepository.save(lot);
        recordMovement(saved, StockMovementType.RECEIVE, quantity, performedBy, "Initial receipt");
        return saved;
    }

    @Override
    @Transactional
    public StockMovement receiveIntoLot(Long lotId, BigDecimal quantity, String performedBy, String reference) {
        StockLot lot = getLot(lotId);
        lot.setQuantityOnHand(lot.getQuantityOnHand().add(quantity));
        stockLotRepository.save(lot);
        return recordMovement(lot, StockMovementType.RECEIVE, quantity, performedBy, reference);
    }

    @Override
    @Transactional
    public StockMovement consume(Long lotId, BigDecimal quantity, String performedBy, String reference) {
        StockLot lot = getLot(lotId);

        if (lot.getQuantityOnHand().compareTo(quantity) < 0) {
            throw new FormCraftException("Insufficient stock in lot " + lot.getLotNumber()
                    + ": on hand=" + lot.getQuantityOnHand() + ", requested=" + quantity);
        }

        lot.setQuantityOnHand(lot.getQuantityOnHand().subtract(quantity));
        stockLotRepository.save(lot);
        StockMovement movement = recordMovement(lot, StockMovementType.CONSUME, quantity, performedBy, reference);

        if (lot.getQuantityOnHand().compareTo(DEFAULT_LOW_STOCK_THRESHOLD) < 0) {
            notificationService.notifyRole(UserRole.PURCHASING, "Low stock alert",
                    lot.getProduct().getName() + " (lot " + lot.getLotNumber() + ") is low: "
                            + lot.getQuantityOnHand() + " " + lot.getUnit() + " remaining.",
                    "/inventory", NotificationCategory.INVENTORY);
        }

        return movement;
    }

    @Override
    @Transactional
    public StockMovement adjust(Long lotId, BigDecimal delta, String performedBy, String reference) {
        StockLot lot = getLot(lotId);
        BigDecimal newQuantity = lot.getQuantityOnHand().add(delta);

        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new FormCraftException("Adjustment would result in negative stock for lot " + lot.getLotNumber());
        }

        lot.setQuantityOnHand(newQuantity);
        stockLotRepository.save(lot);
        return recordMovement(lot, StockMovementType.ADJUST, delta, performedBy, reference);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockMovement> getMovements(Long lotId) {
        return stockMovementRepository.findByStockLotIdOrderByPerformedAtDesc(lotId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLot> getLowStock(BigDecimal threshold) {
        BigDecimal effectiveThreshold = threshold != null ? threshold : DEFAULT_LOW_STOCK_THRESHOLD;
        return stockLotRepository.findAllWithDetails().stream()
                .filter(lot -> "ACTIVE".equals(lot.getStatus()))
                .filter(lot -> lot.getQuantityOnHand().compareTo(effectiveThreshold) < 0)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getTotalOnHand(Long productId) {
        return stockLotRepository.totalOnHandForProduct(productId);
    }

    private StockMovement recordMovement(StockLot lot, StockMovementType type, BigDecimal quantity,
                                          String performedBy, String reference) {
        StockMovement movement = new StockMovement();
        movement.setStockLot(lot);
        movement.setMovementType(type);
        movement.setQuantity(quantity);
        movement.setPerformedBy(performedBy);
        movement.setReference(reference);
        return stockMovementRepository.save(movement);
    }
}
