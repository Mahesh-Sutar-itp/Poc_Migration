package fr.formcraft.web.controller;

import fr.formcraft.model.entity.CustomAttributeDefinition;
import fr.formcraft.model.enums.CustomAttributeType;
import fr.formcraft.model.enums.ProductType;
import fr.formcraft.sdk.attributes.CustomAttributeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-facing endpoint for Customization Gate 2 (BMIDE-style): register a custom
 * attribute on Product without a schema migration or a Java code change.
 */
@RestController
@RequestMapping("/attribute-definitions")
public class CustomAttributeController {

    private final CustomAttributeService customAttributeService;

    @Autowired
    public CustomAttributeController(CustomAttributeService customAttributeService) {
        this.customAttributeService = customAttributeService;
    }

    @GetMapping
    public ResponseEntity<List<CustomAttributeDefinition>> list() {
        return ResponseEntity.ok(customAttributeService.listDefinitions());
    }

    @PostMapping
    public ResponseEntity<CustomAttributeDefinition> define(@Valid @RequestBody DefineAttributeRequest request) {
        CustomAttributeDefinition definition = new CustomAttributeDefinition();
        definition.setAttributeKey(request.attributeKey());
        definition.setLabel(request.label());
        definition.setDataType(request.dataType());
        definition.setRequired(request.required());
        definition.setAppliesToProductType(request.appliesToProductType());
        definition.setValidationRegex(request.validationRegex());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(customAttributeService.defineAttribute(definition));
    }

    public record DefineAttributeRequest(
            @NotBlank String attributeKey,
            @NotBlank String label,
            @NotNull CustomAttributeType dataType,
            boolean required,
            ProductType appliesToProductType,
            String validationRegex
    ) {}
}
