import pytest
from unittest.mock import MagicMock, patch

from app.core.exceptions import FormCraftException
from app.models.user import User
from app.services import auth_service


class TestAuthService:
    """Port of AuthServiceTest.java — 2 tests."""

    def setup_method(self):
        self.user = User()
        self.user.id = 1
        self.user.username = "plmmanager"
        self.user.password_hash = "$2b$10$15qZGfi/R2Wh/hy0Su3QRO7IPDcYQCIR2t3jgutIo/e3kbTnHWkFq"
        self.user.full_name = "Priya Patel"
        self.user.role = "PLM_MANAGER"
        self.user.enabled = True

    @patch("app.services.auth_service.user_repository")
    def test_login_returns_token(self, mock_repo):
        mock_repo.find_by_username.return_value = self.user
        with patch("app.services.auth_service.verify_password", return_value=True):
            result = auth_service.login(MagicMock(), "plmmanager", "Passw0rd!")
        assert result["token"]
        assert result["user"].username == "plmmanager"

    @patch("app.services.auth_service.user_repository")
    def test_login_bad_credentials_throws(self, mock_repo):
        mock_repo.find_by_username.return_value = self.user
        with patch("app.services.auth_service.verify_password", return_value=False):
            with pytest.raises(FormCraftException, match="Invalid username or password"):
                auth_service.login(MagicMock(), "plmmanager", "wrong-password")
