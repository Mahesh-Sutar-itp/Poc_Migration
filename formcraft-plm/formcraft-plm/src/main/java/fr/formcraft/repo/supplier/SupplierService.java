package fr.formcraft.repo.supplier;

import fr.formcraft.model.entity.Supplier;
import fr.formcraft.model.entity.SupplierProduct;

import java.math.BigDecimal;
import java.util.List;

public interface SupplierService {

    List<Supplier> findAll();

    Supplier getById(Long id);

    Supplier createSupplier(Supplier supplier);

    Supplier updateSupplier(Long id, Supplier updated);

    void deleteSupplier(Long id);

    SupplierProduct linkProduct(Long supplierId, Long productId, BigDecimal pricePerKg,
                                 Integer leadTimeDays, BigDecimal moq, boolean preferred);

    void unlinkProduct(Long supplierId, Long productId);

    List<SupplierProduct> getProductsForSupplier(Long supplierId);

    List<SupplierProduct> getSuppliersForProduct(Long productId);
}
