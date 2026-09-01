package fr.formcraft.repo.user.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.common.exception.FormCraftException;
import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.jpa.UserRepository;
import fr.formcraft.repo.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("userService")
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    @Override
    @Transactional
    public User createUser(String username, String rawPassword, String fullName, String email, UserRole role) {
        if (userRepository.existsByUsername(username)) {
            throw new FormCraftException("Username '" + username + "' is already taken");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(role);
        user.setEnabled(true);

        return userRepository.save(user);
    }

    @Override
    @Transactional
    public User updateUser(Long id, String fullName, String email, UserRole role, boolean enabled) {
        User user = getById(id);
        user.setFullName(fullName);
        user.setEmail(email);
        user.setRole(role);
        user.setEnabled(enabled);
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newRawPassword) {
        User user = getById(id);
        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = getById(id);
        userRepository.delete(user);
    }
}
