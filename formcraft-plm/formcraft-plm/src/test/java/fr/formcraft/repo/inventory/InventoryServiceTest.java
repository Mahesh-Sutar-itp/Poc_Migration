package fr.formcraft.repo.inventory;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.StockLot;
import fr.formcraft.model.entity.StockMovement;
import fr.formcraft.repo.inventory.impl.InventoryServiceImpl;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.StockLotRepository;
import fr.formcraft.repo.jpa.StockMovementRepository;
import fr.formcraft.repo.jpa.SupplierRepository;
import fr.formcraft.repo.notification.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService unit tests")
class InventoryServiceTest {

    @Mock private StockLotRepository stockLotRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private ProductRepository productRepository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private StockLot lot;

    @BeforeEach
    void setUp() {
        Product product = new Product();
        product.setId(1L);
        product.setName("Wheat Flour");

        lot = new StockLot();
        lot.setId(1L);
        lot.setProduct(product);
        lot.setLotNumber("LOT-001");
        lot.setQuantityOnHand(BigDecimal.valueOf(100));
        lot.setUnit("kg");
        lot.setStatus("ACTIVE");

        lenient().when(stockLotRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(stockMovementRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    @DisplayName("consume reduces quantity on hand and records a CONSUME movement")
    void consumeReducesQuantity() {
        when(stockLotRepository.findById(1L)).thenReturn(Optional.of(lot));

        StockMovement movement = inventoryService.consume(1L, BigDecimal.valueOf(40), "operator", "Batch #1");

        assertThat(lot.getQuantityOnHand()).isEqualByComparingTo("60");
        assertThat(movement.getQuantity()).isEqualByComparingTo("40");
    }

    @Test
    @DisplayName("consume throws when requested quantity exceeds what's on hand")
    void consumeThrowsWhenInsufficient() {
        when(stockLotRepository.findById(1L)).thenReturn(Optional.of(lot));

        assertThatThrownBy(() -> inventoryService.consume(1L, BigDecimal.valueOf(500), "operator", "Batch #2"))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("Insufficient stock");
    }

    @Test
    @DisplayName("adjust rejects a negative delta that would drop stock below zero")
    void adjustRejectsNegativeResult() {
        when(stockLotRepository.findById(1L)).thenReturn(Optional.of(lot));

        assertThatThrownBy(() -> inventoryService.adjust(1L, BigDecimal.valueOf(-200), "operator", "correction"))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("negative stock");
    }

    @Test
    @DisplayName("adjust applies a positive delta correctly")
    void adjustAppliesPositiveDelta() {
        when(stockLotRepository.findById(1L)).thenReturn(Optional.of(lot));

        inventoryService.adjust(1L, BigDecimal.valueOf(10), "operator", "count correction");

        assertThat(lot.getQuantityOnHand()).isEqualByComparingTo("110");
    }
}
