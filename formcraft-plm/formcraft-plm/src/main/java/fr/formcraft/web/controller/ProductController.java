package fr.formcraft.web.controller;

import fr.formcraft.model.entity.AuditLog;
import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.repo.audit.AuditService;
import fr.formcraft.repo.product.ProductService;
import fr.formcraft.repo.search.ProductQueryBuilder;
import fr.formcraft.repo.jpa.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;
    private final ProductQueryBuilder queryBuilder;
    private final ProductRepository productRepository;
    private final AuditService auditService;

    @Autowired
    public ProductController(ProductService productService,
                              ProductQueryBuilder queryBuilder,
                              ProductRepository productRepository,
                              AuditService auditService) {
        this.productService = productService;
        this.queryBuilder = queryBuilder;
        this.productRepository = productRepository;
        this.auditService = auditService;
    }

    @GetMapping
    public ResponseEntity<Page<Product>> listProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sortBy) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100),
                Sort.by(sortBy).ascending());
        return ResponseEntity.ok(productService.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Product>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) ProductType type,
            @RequestParam(required = false) ProductState state,
            @RequestParam(required = false) String allergen) {

        ProductQueryBuilder.SearchCriteria criteria = ProductQueryBuilder.SearchCriteria.builder()
                .name(name).code(code).type(type).state(state).allergen(allergen).build();

        return ResponseEntity.ok(productRepository.findAll(queryBuilder.buildSpecification(criteria)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody CreateProductRequest request) {
        Product product = new Product();
        product.setCode(request.code());
        product.setName(request.name());
        product.setDescription(request.description());
        product.setProductType(request.productType());
        product.setUnit(request.unit());
        if (request.costPerKg() != null) {
            product.setCostPerKg(BigDecimal.valueOf(request.costPerKg()));
        }
        product.setFormulaExpression(request.formulaExpression());
        product.setAllergenFlags(request.allergenFlags());

        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id,
                                                  @Valid @RequestBody CreateProductRequest request) {
        Product updated = new Product();
        updated.setName(request.name());
        updated.setDescription(request.description());
        updated.setUnit(request.unit());
        if (request.costPerKg() != null) {
            updated.setCostPerKg(BigDecimal.valueOf(request.costPerKg()));
        }
        updated.setFormulaExpression(request.formulaExpression());
        updated.setAllergenFlags(request.allergenFlags());

        return ResponseEntity.ok(productService.updateProduct(id, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/composition")
    public ResponseEntity<Product> addComposition(@PathVariable Long id,
                                                   @Valid @RequestBody AddCompositionRequest request) {
        return ResponseEntity.ok(
                productService.addCompositionLine(id, request.ingredientId(),
                        request.quantity(), request.unit()));
    }

    @DeleteMapping("/{id}/composition/{lineId}")
    public ResponseEntity<Product> removeComposition(@PathVariable Long id,
                                                      @PathVariable Long lineId) {
        return ResponseEntity.ok(productService.removeCompositionLine(id, lineId));
    }

    @GetMapping("/{id}/composition")
    public ResponseEntity<List<CompositionLine>> getComposition(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getComposition(id));
    }

    @GetMapping("/{id}/audit-history")
    public ResponseEntity<List<AuditLog>> getAuditHistory(@PathVariable Long id) {
        return ResponseEntity.ok(auditService.getProductHistory(id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
                "draft",        productService.countByState(ProductState.DRAFT),
                "inValidation", productService.countByState(ProductState.IN_VALIDATION),
                "validated",    productService.countByState(ProductState.VALIDATED),
                "archived",     productService.countByState(ProductState.ARCHIVED)
        ));
    }

    // ── Request records ───────────────────────────────────────────────────

    public record CreateProductRequest(
            @NotBlank String code,
            @NotBlank String name,
            String description,
            @NotNull ProductType productType,
            String unit,
            Double costPerKg,
            String formulaExpression,
            String allergenFlags
    ) {}

    public record AddCompositionRequest(
            @NotNull Long ingredientId,
            @Positive double quantity,
            String unit
    ) {}
}
