package fr.formcraft.model.entity;

import fr.formcraft.model.enums.CustomAttributeType;
import fr.formcraft.model.enums.ProductType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Customization Gate 2 (BMIDE-style): a client-defined attribute that {@link Product}
 * instances may carry in their {@code customAttributes} map. Registering one of these
 * is a config-time action — no schema migration or Java code required.
 */
@Entity
@Table(name = "product_attribute_definitions")
@Getter
@Setter
@NoArgsConstructor
public class CustomAttributeDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attribute_key", nullable = false, unique = true, length = 100)
    private String attributeKey;

    @Column(nullable = false, length = 150)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 20)
    private CustomAttributeType dataType;

    @Column(nullable = false)
    private boolean required;

    /** Restrict this attribute to one product type; null applies it to every product. */
    @Enumerated(EnumType.STRING)
    @Column(name = "applies_to_product_type", length = 30)
    private ProductType appliesToProductType;

    @Column(name = "validation_regex", length = 255)
    private String validationRegex;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
