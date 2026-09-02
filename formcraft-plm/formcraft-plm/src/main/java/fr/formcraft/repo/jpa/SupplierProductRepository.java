package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.SupplierProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierProductRepository extends JpaRepository<SupplierProduct, Long> {

    @Query("SELECT sp FROM SupplierProduct sp LEFT JOIN FETCH sp.supplier WHERE sp.product.id = :productId")
    List<SupplierProduct> findByProductId(@Param("productId") Long productId);

    @Query("SELECT sp FROM SupplierProduct sp LEFT JOIN FETCH sp.product WHERE sp.supplier.id = :supplierId")
    List<SupplierProduct> findBySupplierId(@Param("supplierId") Long supplierId);

    void deleteBySupplierIdAndProductId(Long supplierId, Long productId);
}
