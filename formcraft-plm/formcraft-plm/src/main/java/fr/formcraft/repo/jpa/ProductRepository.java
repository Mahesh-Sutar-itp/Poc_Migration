package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** JPA repository for Product entity. */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByCode(String code);

    boolean existsByCode(String code);

    List<Product> findByProductType(ProductType productType);

    List<Product> findByState(ProductState state);

    Page<Product> findByProductTypeAndState(ProductType productType, ProductState state, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.state = :state AND p.productType IN :types")
    List<Product> findByStateAndTypes(@Param("state") ProductState state,
                                      @Param("types") List<ProductType> types);

    @Query("SELECT p FROM Product p WHERE p.allergenFlags LIKE %:allergen%")
    List<Product> findByAllergen(@Param("allergen") String allergen);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.compositionLines cl " +
           "LEFT JOIN FETCH cl.ingredient WHERE p.id = :id")
    Optional<Product> findByIdWithComposition(@Param("id") Long id);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.nutrientValues WHERE p.id = :id")
    Optional<Product> findByIdWithNutrients(@Param("id") Long id);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.state = :state")
    long countByState(@Param("state") ProductState state);
}
