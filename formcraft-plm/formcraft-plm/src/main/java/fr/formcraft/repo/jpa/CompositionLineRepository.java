package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.CompositionLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompositionLineRepository extends JpaRepository<CompositionLine, Long> {

    @Query("SELECT cl FROM CompositionLine cl LEFT JOIN FETCH cl.ingredient " +
           "WHERE cl.product.id = :productId ORDER BY cl.position ASC")
    List<CompositionLine> findByProductIdWithIngredient(@Param("productId") Long productId);

    void deleteByProductId(Long productId);

    long countByProductId(Long productId);
}
