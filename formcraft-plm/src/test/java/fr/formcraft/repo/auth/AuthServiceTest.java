package fr.formcraft.repo.auth;

import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.auth.impl.AuthServiceImpl;
import fr.formcraft.repo.jpa.UserRepository;
import fr.formcraft.security.AppUserPrincipal;
import fr.formcraft.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService unit tests")
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private UserRepository userRepository;

    private JwtService jwtService;
    private AuthServiceImpl authService;

    private User user;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("test-jwt-secret-key-for-unit-tests-only-min-256-bits", 3600000);
        authService = new AuthServiceImpl(authenticationManager, jwtService, userRepository);

        user = new User();
        user.setId(1L);
        user.setUsername("plmmanager");
        user.setPasswordHash("hashed");
        user.setFullName("Priya Patel");
        user.setRole(UserRole.PLM_MANAGER);
        user.setEnabled(true);
    }

    @Test
    @DisplayName("login returns a valid JWT for correct credentials")
    void loginReturnsToken() {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                new AppUserPrincipal(user), null, new AppUserPrincipal(user).getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);

        AuthService.LoginResult result = authService.login("plmmanager", "Passw0rd!");

        assertThat(result.token()).isNotBlank();
        assertThat(result.user().getUsername()).isEqualTo("plmmanager");
        assertThat(jwtService.isValid(result.token())).isTrue();
        assertThat(jwtService.extractUsername(result.token())).isEqualTo("plmmanager");
    }

    @Test
    @DisplayName("login with bad credentials throws a domain exception, not the raw Spring Security one")
    void loginWithBadCredentialsThrows() {
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("bad creds"));

        assertThatThrownBy(() -> authService.login("plmmanager", "wrong-password"))
                .isInstanceOf(FormCraftException.class)
                .hasMessageContaining("Invalid username or password");
    }
}
