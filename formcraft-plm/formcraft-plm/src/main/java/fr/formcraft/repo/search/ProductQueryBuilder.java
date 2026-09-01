package fr.formcraft.repo.search;

import fr.formcraft.model.entity.Product;
import fr.formcraft.model.enums.ProductState;
import fr.formcraft.model.enums.ProductType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Dynamic query builder for products using JPA Specifications.
 * Mirrors beCPG's BeCPGQueryBuilder pattern — builds complex
 * queries from filter criteria without raw SQL.
 */
@Service
public class ProductQueryBuilder {

    /**
     * Builds a JPA Specification from the given search criteria.
     * All criteria are optional — null values are ignored.
     *
     * @param criteria the filter criteria to apply
     * @return a composed Specification
     */
    public Specification<Product> buildSpecification(SearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getName() != null && !criteria.getName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("name")),
                        "%" + criteria.getName().toLowerCase() + "%"));
            }

            if (criteria.getCode() != null && !criteria.getCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("code")),
                        "%" + criteria.getCode().toLowerCase() + "%"));
            }

            if (criteria.getProductType() != null) {
                predicates.add(cb.equal(root.get("productType"), criteria.getProductType()));
            }

            if (criteria.getState() != null) {
                predicates.add(cb.equal(root.get("state"), criteria.getState()));
            }

            if (criteria.getAllergen() != null && !criteria.getAllergen().isBlank()) {
                predicates.add(cb.like(root.get("allergenFlags"),
                        "%" + criteria.getAllergen() + "%"));
            }

            if (criteria.getHasFormulaExpression() != null) {
                if (criteria.getHasFormulaExpression()) {
                    predicates.add(cb.isNotNull(root.get("formulaExpression")));
                    predicates.add(cb.notEqual(root.get("formulaExpression"), ""));
                } else {
                    predicates.add(cb.or(
                            cb.isNull(root.get("formulaExpression")),
                            cb.equal(root.get("formulaExpression"), "")));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Search criteria object — all fields optional.
     */
    public static class SearchCriteria {
        private String name;
        private String code;
        private ProductType productType;
        private ProductState state;
        private String allergen;
        private Boolean hasFormulaExpression;

        public static Builder builder() {
            return new Builder();
        }

        public String getName()                  { return name; }
        public String getCode()                  { return code; }
        public ProductType getProductType()       { return productType; }
        public ProductState getState()            { return state; }
        public String getAllergen()               { return allergen; }
        public Boolean getHasFormulaExpression() { return hasFormulaExpression; }

        public static class Builder {
            private final SearchCriteria criteria = new SearchCriteria();

            public Builder name(String name)                             { criteria.name = name; return this; }
            public Builder code(String code)                             { criteria.code = code; return this; }
            public Builder type(ProductType type)                        { criteria.productType = type; return this; }
            public Builder state(ProductState state)                     { criteria.state = state; return this; }
            public Builder allergen(String allergen)                     { criteria.allergen = allergen; return this; }
            public Builder hasFormula(Boolean hasFormula)                { criteria.hasFormulaExpression = hasFormula; return this; }
            public SearchCriteria build()                                { return criteria; }
        }
    }
}
