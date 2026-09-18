import os

import pytest

from app.core.config import settings
from app.sdk import discovery, workflow


@pytest.fixture
def custom_repo(tmp_path, monkeypatch):
    """A customization repo laid out the way a client's would be, mounted for one test."""
    addons = tmp_path / "addons"
    addons.mkdir()
    monkeypatch.setattr(settings, "custom_path", str(tmp_path))
    return addons


class TestCoreAddonsSeal:
    """app/addons is product packaging — a client rule found there is a deployment mistake."""

    def test_empty_core_package_is_accepted(self, custom_repo):
        discovery.load_addons()

    def test_stray_core_module_refuses_to_boot(self, custom_repo, monkeypatch):
        monkeypatch.setattr(
            "app.sdk.discovery.core_addons_package",
            type("Pkg", (), {"__path__": [str(custom_repo)]})(),
        )
        (custom_repo / "client_rule.py").write_text("")
        with pytest.raises(RuntimeError, match="sealed"):
            discovery.load_addons()

    def test_seal_message_points_at_the_customization_repo(self, custom_repo, monkeypatch):
        monkeypatch.setattr(
            "app.sdk.discovery.core_addons_package",
            type("Pkg", (), {"__path__": [str(custom_repo)]})(),
        )
        (custom_repo / "client_rule.py").write_text("")
        with pytest.raises(RuntimeError, match="FORMCRAFT_CUSTOM_PATH"):
            discovery.load_addons()


class TestCustomAddonsDiscovery:
    def test_no_custom_path_configured_is_not_an_error(self, monkeypatch):
        monkeypatch.setattr(settings, "custom_path", "")
        assert discovery.custom_addons_dirs() == []
        discovery.load_addons()

    def test_addons_dir_of_each_configured_repo_is_found(self, tmp_path, monkeypatch):
        first, second = tmp_path / "a", tmp_path / "b"
        (first / "addons").mkdir(parents=True)
        (second / "addons").mkdir(parents=True)
        monkeypatch.setattr(settings, "custom_path", os.pathsep.join([str(first), str(second)]))
        assert discovery.custom_addons_dirs() == [first / "addons", second / "addons"]

    def test_repo_without_an_addons_dir_is_skipped(self, tmp_path, monkeypatch):
        monkeypatch.setattr(settings, "custom_path", str(tmp_path))
        assert discovery.custom_addons_dirs() == []

    def test_handler_in_the_custom_repo_self_registers(self, custom_repo):
        (custom_repo / "acme_rule.py").write_text(
            "from app.sdk.workflow import ChangeRequestTransitionHandler, register_handler\n"
            "class AcmeRule(ChangeRequestTransitionHandler):\n"
            "    pass\n"
            "register_handler(AcmeRule())\n"
        )
        before = len(workflow.registered_handlers())
        discovery.load_addons()
        registered = workflow.registered_handlers()
        assert len(registered) == before + 1
        assert type(registered[-1]).__name__ == "AcmeRule"
