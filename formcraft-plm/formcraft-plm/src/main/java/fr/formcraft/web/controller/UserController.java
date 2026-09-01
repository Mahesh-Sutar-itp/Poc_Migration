package fr.formcraft.web.controller;

import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.user.UserService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin-only user & role management. Access is restricted to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getById(id));
    }

    @PostMapping
    public ResponseEntity<User> createUser(@jakarta.validation.Valid @RequestBody CreateUserRequest request) {
        User created = userService.createUser(request.username(), request.password(),
                request.fullName(), request.email(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id,
                                            @jakarta.validation.Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request.fullName(), request.email(),
                request.role(), request.enabled()));
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Void> resetPassword(@PathVariable Long id,
                                               @RequestBody ResetPasswordRequest request) {
        userService.resetPassword(id, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    public record CreateUserRequest(
            @NotBlank String username,
            @NotBlank @Size(min = 8) String password,
            String fullName,
            @Email String email,
            @NotNull UserRole role
    ) {}

    public record UpdateUserRequest(
            String fullName,
            @Email String email,
            @NotNull UserRole role,
            boolean enabled
    ) {}

    public record ResetPasswordRequest(@NotBlank @Size(min = 8) String newPassword) {}
}
