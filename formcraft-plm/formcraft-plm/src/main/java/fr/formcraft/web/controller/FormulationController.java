package fr.formcraft.web.controller;

import fr.formcraft.model.entity.FormulationResult;
import fr.formcraft.model.entity.Product;
import fr.formcraft.repo.formulation.FormulationService;
import fr.formcraft.repo.jpa.FormulationResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/products/{productId}/formulate")
public class FormulationController {

    private final FormulationService formulationService;
    private final FormulationResultRepository formulationResultRepository;

    @Autowired
    public FormulationController(FormulationService formulationService,
                                  FormulationResultRepository formulationResultRepository) {
        this.formulationService = formulationService;
        this.formulationResultRepository = formulationResultRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> formulate(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "default") String chainId) {

        Product product = formulationService.formulate(productId, chainId);
        FormulationResult latest = formulationResultRepository
                .findFirstByProductIdAndChainIdOrderByFormulatedAtDesc(productId, chainId)
                .orElse(null);

        Map<String, Object> response = Map.of(
                "productId",   productId,
                "productName", product.getName(),
                "chainId",     chainId,
                "result",      latest != null ? latest : "No result"
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<FormulationResult>> getHistory(@PathVariable Long productId) {
        return ResponseEntity.ok(
                formulationResultRepository.findByProductIdOrderByFormulatedAtDesc(productId));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkShouldFormulate(@PathVariable Long productId) {
        return ResponseEntity.ok(Map.of(
                "shouldFormulate", formulationService.shouldFormulate(productId)
        ));
    }
}
