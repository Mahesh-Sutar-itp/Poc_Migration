package fr.formcraft.web.controller;

import fr.formcraft.model.entity.StockLot;
import fr.formcraft.model.entity.StockMovement;
import fr.formcraft.repo.inventory.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    @Autowired
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/lots")
    public ResponseEntity<List<StockLot>> listLots() {
        return ResponseEntity.ok(inventoryService.getAllLots());
    }

    @GetMapping("/lots/{id}")
    public ResponseEntity<StockLot> getLot(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getLot(id));
    }

    @GetMapping("/products/{productId}/lots")
    public ResponseEntity<List<StockLot>> getLotsForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getLotsForProduct(productId));
    }

    @PostMapping("/products/{productId}/lots")
    public ResponseEntity<StockLot> receiveLot(@PathVariable Long productId,
                                                @Valid @RequestBody ReceiveLotRequest request,
                                                Authentication auth) {
        StockLot lot = inventoryService.receiveLot(productId, request.lotNumber(), request.quantity(),
                request.unit(), request.expiryDate(), request.supplierId(), auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(lot);
    }

    @PostMapping("/lots/{id}/receive")
    public ResponseEntity<StockMovement> receive(@PathVariable Long id, @Valid @RequestBody MovementRequest request,
                                                  Authentication auth) {
        return ResponseEntity.ok(inventoryService.receiveIntoLot(id, request.quantity(), auth.getName(), request.reference()));
    }

    @PostMapping("/lots/{id}/consume")
    public ResponseEntity<StockMovement> consume(@PathVariable Long id, @Valid @RequestBody MovementRequest request,
                                                  Authentication auth) {
        return ResponseEntity.ok(inventoryService.consume(id, request.quantity(), auth.getName(), request.reference()));
    }

    @PostMapping("/lots/{id}/adjust")
    public ResponseEntity<StockMovement> adjust(@PathVariable Long id, @Valid @RequestBody AdjustRequest request,
                                                 Authentication auth) {
        return ResponseEntity.ok(inventoryService.adjust(id, request.delta(), auth.getName(), request.reference()));
    }

    @GetMapping("/lots/{id}/movements")
    public ResponseEntity<List<StockMovement>> getMovements(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getMovements(id));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<StockLot>> lowStock(@RequestParam(required = false) BigDecimal threshold) {
        return ResponseEntity.ok(inventoryService.getLowStock(threshold));
    }

    public record ReceiveLotRequest(@NotBlank String lotNumber, @NotNull @Positive BigDecimal quantity,
                                     String unit, LocalDate expiryDate, Long supplierId) {}

    public record MovementRequest(@NotNull @Positive BigDecimal quantity, String reference) {}

    public record AdjustRequest(@NotNull BigDecimal delta, String reference) {}
}
