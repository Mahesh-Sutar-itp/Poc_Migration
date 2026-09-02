package fr.formcraft.web.controller;

import fr.formcraft.model.entity.Specification;
import fr.formcraft.model.enums.SpecType;
import fr.formcraft.repo.specification.SpecificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
public class SpecificationController {

    private final SpecificationService specificationService;

    @Autowired
    public SpecificationController(SpecificationService specificationService) {
        this.specificationService = specificationService;
    }

    @GetMapping("/products/{productId}/specifications")
    public ResponseEntity<List<Specification>> getForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(specificationService.getForProduct(productId));
    }

    @PostMapping("/products/{productId}/specifications")
    public ResponseEntity<Specification> create(@PathVariable Long productId,
                                                 @Valid @RequestBody SpecRequest request,
                                                 Authentication auth) {
        Specification spec = new Specification();
        spec.setParameter(request.parameter());
        spec.setSpecType(request.specType());
        spec.setMinValue(request.minValue());
        spec.setMaxValue(request.maxValue());
        spec.setTargetValue(request.targetValue());
        spec.setUnit(request.unit());

        Specification created = specificationService.createSpecification(productId, spec, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/specifications/{id}")
    public ResponseEntity<Specification> update(@PathVariable Long id, @Valid @RequestBody SpecRequest request) {
        Specification spec = new Specification();
        spec.setParameter(request.parameter());
        spec.setSpecType(request.specType());
        spec.setMinValue(request.minValue());
        spec.setMaxValue(request.maxValue());
        spec.setTargetValue(request.targetValue());
        spec.setUnit(request.unit());

        return ResponseEntity.ok(specificationService.updateSpecification(id, spec));
    }

    @DeleteMapping("/specifications/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        specificationService.deleteSpecification(id);
        return ResponseEntity.noContent().build();
    }

    public record SpecRequest(
            @NotBlank String parameter,
            @NotNull SpecType specType,
            BigDecimal minValue,
            BigDecimal maxValue,
            BigDecimal targetValue,
            String unit
    ) {}
}
