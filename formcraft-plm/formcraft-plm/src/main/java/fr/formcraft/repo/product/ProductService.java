package fr.formcraft.repo.product;

import fr.formcraft.model.entity.CompositionLine;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Product service interface — core CRUD and business operations.
 * Mirrors beCPG's ProductService interface pattern.
 */
public interface ProductService {

    Product createProduct(Product product);

    Product updateProduct(Long productId, Product updated);

    Optional<Product> findById(Long productId);

    Product getById(Long productId);

    Optional<Product> findByCode(String code);

    Page<Product> findAll(Pageable pageable);

    List<Product> findByType(ProductType type);

    List<Product> findByState(ProductState state);

    void deleteProduct(Long productId);

    Product addCompositionLine(Long productId, Long ingredientId, double quantity, String unit);

    Product removeCompositionLine(Long productId, Long compositionLineId);

    List<CompositionLine> getComposition(Long productId);

    long countByState(ProductState state);
}
