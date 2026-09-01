package fr.formcraft.repo.supplier.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.Product;
import fr.formcraft.model.entity.Supplier;
import fr.formcraft.model.entity.SupplierProduct;
import fr.formcraft.repo.jpa.ProductRepository;
import fr.formcraft.repo.jpa.SupplierProductRepository;
import fr.formcraft.repo.jpa.SupplierRepository;
import fr.formcraft.repo.supplier.SupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service("supplierService")
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierProductRepository supplierProductRepository;
    private final ProductRepository productRepository;

    @Autowired
    public SupplierServiceImpl(SupplierRepository supplierRepository,
                                SupplierProductRepository supplierProductRepository,
                                ProductRepository productRepository) {
        this.supplierRepository = supplierRepository;
        this.supplierProductRepository = supplierProductRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Supplier getById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Supplier", id));
    }

    @Override
    @Transactional
    public Supplier createSupplier(Supplier supplier) {
        if (supplierRepository.existsByCode(supplier.getCode())) {
            throw new FormCraftException("Supplier with code '" + supplier.getCode() + "' already exists");
        }
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    @Override
    @Transactional
    public Supplier updateSupplier(Long id, Supplier updated) {
        Supplier existing = getById(id);
        existing.setName(updated.getName());
        existing.setContactName(updated.getContactName());
        existing.setContactEmail(updated.getContactEmail());
        existing.setPhone(updated.getPhone());
        existing.setAddress(updated.getAddress());
        existing.setRating(updated.getRating());
        existing.setActive(updated.isActive());
        return supplierRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = getById(id);
        supplierRepository.delete(supplier);
    }

    @Override
    @Transactional
    public SupplierProduct linkProduct(Long supplierId, Long productId, BigDecimal pricePerKg,
                                        Integer leadTimeDays, BigDecimal moq, boolean preferred) {
        Supplier supplier = getById(supplierId);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product", productId));

        SupplierProduct link = new SupplierProduct();
        link.setSupplier(supplier);
        link.setProduct(product);
        link.setPricePerKg(pricePerKg);
        link.setLeadTimeDays(leadTimeDays);
        link.setMoq(moq);
        link.setPreferred(preferred);
        return supplierProductRepository.save(link);
    }

    @Override
    @Transactional
    public void unlinkProduct(Long supplierId, Long productId) {
        supplierProductRepository.deleteBySupplierIdAndProductId(supplierId, productId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProduct> getProductsForSupplier(Long supplierId) {
        return supplierProductRepository.findBySupplierId(supplierId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierProduct> getSuppliersForProduct(Long productId) {
        return supplierProductRepository.findByProductId(productId);
    }
}
