package fr.formcraft.repo.user;

import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.UserRole;

import java.util.List;

public interface UserService {

    List<User> findAll();

    User getById(Long id);

    User createUser(String username, String rawPassword, String fullName, String email, UserRole role);

    User updateUser(Long id, String fullName, String email, UserRole role, boolean enabled);

    void resetPassword(Long id, String newRawPassword);

    void deleteUser(Long id);
}
