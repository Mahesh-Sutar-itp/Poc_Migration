import pytest
from unittest.mock import MagicMock, patch

from app.core.exceptions import FormCraftException
from app.core.security import create_access_token, decode_token


class TestJwtService:
    """Port of JwtServiceTest.java — 3 tests, zero mocks."""

    def setup_method(self):
        self.secret = "test-jwt-secret-key-for-unit-tests-only-min-256-bits"

    def test_generated_token_is_valid(self):
        with patch("app.core.security.settings") as s:
            s.jwt_secret = self.secret
            s.jwt_expiration_ms = 3600000
            token = create_access_token("admin", "ADMIN", "Alex Admin")
            payload = decode_token(token)
            assert payload["sub"] == "admin"
            assert payload["role"] == "ADMIN"

    def test_expired_token_is_invalid(self):
        with patch("app.core.security.settings") as s:
            s.jwt_secret = self.secret
            s.jwt_expiration_ms = -1000
            token = create_access_token("admin", "ADMIN", "Alex Admin")
            with pytest.raises(Exception):
                decode_token(token)

    def test_wrong_signature_is_invalid(self):
        import jwt as pyjwt
        with patch("app.core.security.settings") as s:
            s.jwt_secret = "a-completely-different-secret-key-min-256-bits-long"
            s.jwt_expiration_ms = 3600000
            token = create_access_token("admin", "ADMIN", "Alex Admin")
        with pytest.raises(pyjwt.InvalidSignatureError):
            with patch("app.core.security.settings") as s2:
                s2.jwt_secret = self.secret
                decode_token(token)
