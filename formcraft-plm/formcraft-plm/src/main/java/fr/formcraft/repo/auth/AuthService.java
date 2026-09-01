package fr.formcraft.repo.auth;

import fr.formcraft.model.entity.User;

public interface AuthService {

    record LoginResult(String token, User user) {}

    LoginResult login(String username, String rawPassword);

    User getCurrentUser(String username);
}
