package fr.formcraft.config;

import fr.formcraft.security.AccessRulePermissionEvaluator;
import fr.formcraft.security.AppUserDetailsService;
import fr.formcraft.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Stateless JWT-based security configuration.
 * Users are backed by the database (see {@link AppUserDetailsService}) instead of
 * the previous in-memory admin/user pair. Roles gate module-level write access;
 * all authenticated users can read across modules, VIEWER can never write.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String PLM_MANAGER = "PLM_MANAGER";
    private static final String QUALITY_MANAGER = "QUALITY_MANAGER";
    private static final String PURCHASING = "PURCHASING";

    private final AppUserDetailsService userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${formcraft.cors.allowed-origins}")
    private String[] allowedOrigins;

    public SecurityConfig(AppUserDetailsService userDetailsService,
                           JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info", "/auth/login").permitAll()
                // User administration is ADMIN-only for every HTTP method
                .requestMatchers("/users/**").hasRole(ADMIN)
                // Customization gates are ADMIN-only for every HTTP method: Gate 2 (custom
                // attribute definitions) is config, Gate 1's registry (extensions) is read-only
                // visibility into deployed code-level handlers, Gate 3 (event-action rules) and
                // Gate 4 (access rules) are config — all are platform-admin concerns
                .requestMatchers("/attribute-definitions/**", "/extensions/**",
                        "/event-action-rules/**", "/access-rules/**", "/report-templates/**").hasRole(ADMIN)
                // Module-specific write restrictions (checked before the generic GET/write rules below)
                .requestMatchers(HttpMethod.POST, "/products/*/workflow/**").hasAnyRole(ADMIN, PLM_MANAGER)
                .requestMatchers(HttpMethod.POST, "/change-requests/*/decide").hasAnyRole(ADMIN, PLM_MANAGER)
                .requestMatchers(HttpMethod.POST, "/change-requests/*/submit").hasAnyRole(ADMIN, PLM_MANAGER, QUALITY_MANAGER)
                .requestMatchers(HttpMethod.POST, "/suppliers/**", "/inventory/**").hasAnyRole(ADMIN, PURCHASING)
                .requestMatchers(HttpMethod.PUT, "/suppliers/**", "/inventory/**").hasAnyRole(ADMIN, PURCHASING)
                .requestMatchers(HttpMethod.DELETE, "/suppliers/**", "/inventory/**").hasAnyRole(ADMIN, PURCHASING)
                .requestMatchers(HttpMethod.POST, "/products/*/specifications/**", "/specifications/**",
                        "/products/*/non-conformances/**", "/non-conformances/**").hasAnyRole(ADMIN, QUALITY_MANAGER)
                .requestMatchers(HttpMethod.PUT, "/products/*/specifications/**", "/specifications/**",
                        "/products/*/non-conformances/**", "/non-conformances/**").hasAnyRole(ADMIN, QUALITY_MANAGER)
                .requestMatchers(HttpMethod.DELETE, "/products/*/specifications/**", "/specifications/**",
                        "/products/*/non-conformances/**", "/non-conformances/**").hasAnyRole(ADMIN, QUALITY_MANAGER)
                // Every module is readable by any authenticated role, including VIEWER
                .requestMatchers(HttpMethod.GET, "/**").authenticated()
                // Personal notification state (read/unread) is mutable by any authenticated role
                .requestMatchers("/notifications/**").authenticated()
                // Every other mutating request is blocked for VIEWER
                .anyRequest().hasAnyRole(ADMIN, PLM_MANAGER, QUALITY_MANAGER, PURCHASING)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Wires Customization Gate 4's {@link AccessRulePermissionEvaluator} into the
     * {@code hasPermission(...)} SpEL function usable from {@code @PreAuthorize}.
     */
    @Bean
    public MethodSecurityExpressionHandler methodSecurityExpressionHandler(AccessRulePermissionEvaluator evaluator) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(evaluator);
        return handler;
    }
}
