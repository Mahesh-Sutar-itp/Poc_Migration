package fr.formcraft.web.controller;

import fr.formcraft.model.entity.User;
import fr.formcraft.repo.auth.AuthService;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request.username(), request.password());
        return ResponseEntity.ok(new LoginResponse(result.token(), toDto(result.user())));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> me(Authentication auth) {
        User user = authService.getCurrentUser(auth.getName());
        return ResponseEntity.ok(toDto(user));
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole());
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    public record LoginResponse(String token, UserDto user) {}

    public record UserDto(Long id, String username, String fullName, String email,
                           fr.formcraft.model.enums.UserRole role) {}
}
