package fr.formcraft.security;

import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("JwtService unit tests")
class JwtServiceTest {

    private JwtService jwtService;
    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("test-jwt-secret-key-for-unit-tests-only-min-256-bits", 3600000);

        user = new User();
        user.setUsername("admin");
        user.setFullName("Alex Admin");
        user.setRole(UserRole.ADMIN);
    }

    @Test
    @DisplayName("a freshly generated token is valid and carries the correct subject")
    void generatedTokenIsValid() {
        String token = jwtService.generateToken(user);

        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("admin");
    }

    @Test
    @DisplayName("an expired token is rejected")
    void expiredTokenIsInvalid() {
        JwtService shortLived = new JwtService("test-jwt-secret-key-for-unit-tests-only-min-256-bits", -1000);
        String token = shortLived.generateToken(user);

        assertThat(shortLived.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("a token signed with a different secret is rejected")
    void tokenWithWrongSignatureIsInvalid() {
        JwtService otherService = new JwtService("a-completely-different-secret-key-min-256-bits-long", 3600000);
        String token = otherService.generateToken(user);

        assertThat(jwtService.isValid(token)).isFalse();
    }
}
