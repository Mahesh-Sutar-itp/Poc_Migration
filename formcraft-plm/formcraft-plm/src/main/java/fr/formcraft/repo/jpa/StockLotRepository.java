package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.StockLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface StockLotRepository extends JpaRepository<StockLot, Long> {

    @Query("SELECT sl FROM StockLot sl LEFT JOIN FETCH sl.product WHERE sl.product.id = :productId ORDER BY sl.expiryDate ASC NULLS LAST")
    List<StockLot> findByProductId(@Param("productId") Long productId);

    @Query("SELECT sl FROM StockLot sl LEFT JOIN FETCH sl.product LEFT JOIN FETCH sl.supplier ORDER BY sl.receivedAt DESC")
    List<StockLot> findAllWithDetails();

    @Query("SELECT COALESCE(SUM(sl.quantityOnHand), 0) FROM StockLot sl WHERE sl.product.id = :productId AND sl.status = 'ACTIVE'")
    BigDecimal totalOnHandForProduct(@Param("productId") Long productId);
}
