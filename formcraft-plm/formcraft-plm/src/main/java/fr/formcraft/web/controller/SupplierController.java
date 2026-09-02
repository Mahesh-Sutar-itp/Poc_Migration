package fr.formcraft.web.controller;

import fr.formcraft.model.entity.Supplier;
import fr.formcraft.model.entity.SupplierProduct;
import fr.formcraft.repo.supplier.SupplierService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    @Autowired
    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public ResponseEntity<List<Supplier>> listSuppliers() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplier(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody SupplierRequest request) {
        Supplier supplier = fromRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createSupplier(supplier));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        Supplier supplier = fromRequest(request);
        return ResponseEntity.ok(supplierService.updateSupplier(id, supplier));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<List<SupplierProduct>> getProducts(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getProductsForSupplier(id));
    }

    @PostMapping("/{id}/products")
    public ResponseEntity<SupplierProduct> linkProduct(@PathVariable Long id,
                                                         @Valid @RequestBody LinkProductRequest request) {
        SupplierProduct link = supplierService.linkProduct(id, request.productId(), request.pricePerKg(),
                request.leadTimeDays(), request.moq(), request.preferred());
        return ResponseEntity.status(HttpStatus.CREATED).body(link);
    }

    @DeleteMapping("/{id}/products/{productId}")
    public ResponseEntity<Void> unlinkProduct(@PathVariable Long id, @PathVariable Long productId) {
        supplierService.unlinkProduct(id, productId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/for-product/{productId}")
    public ResponseEntity<List<SupplierProduct>> getSuppliersForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(supplierService.getSuppliersForProduct(productId));
    }

    private Supplier fromRequest(SupplierRequest request) {
        Supplier supplier = new Supplier();
        supplier.setCode(request.code());
        supplier.setName(request.name());
        supplier.setContactName(request.contactName());
        supplier.setContactEmail(request.contactEmail());
        supplier.setPhone(request.phone());
        supplier.setAddress(request.address());
        supplier.setRating(request.rating());
        supplier.setActive(request.active() == null || request.active());
        return supplier;
    }

    public record SupplierRequest(
            @NotBlank String code,
            @NotBlank String name,
            String contactName,
            String contactEmail,
            String phone,
            String address,
            Integer rating,
            Boolean active
    ) {}

    public record LinkProductRequest(
            @NotNull Long productId,
            BigDecimal pricePerKg,
            Integer leadTimeDays,
            BigDecimal moq,
            boolean preferred
    ) {}
}
