package fr.formcraft.repo.auth.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.User;
import fr.formcraft.repo.auth.AuthService;
import fr.formcraft.repo.jpa.UserRepository;
import fr.formcraft.security.AppUserPrincipal;
import fr.formcraft.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service("authService")
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Autowired
    public AuthServiceImpl(AuthenticationManager authenticationManager,
                            JwtService jwtService,
                            UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResult login(String username, String rawPassword) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, rawPassword));
        } catch (BadCredentialsException e) {
            throw new FormCraftException("Invalid username or password");
        }

        User user = ((AppUserPrincipal) authentication.getPrincipal()).getUser();
        String token = jwtService.generateToken(user);
        return new LoginResult(token, user);
    }

    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User", username));
    }
}
