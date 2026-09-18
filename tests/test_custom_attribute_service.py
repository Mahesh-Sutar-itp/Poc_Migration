import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.core.exceptions import FormCraftException
from app.models.custom_attribute_definition import CustomAttributeDefinition
from app.models.product import Product
from app.sdk import attributes
from app.services import custom_attribute_manifest, custom_attribute_service


def definition(key, data_type="STRING", required=False, applies_to=None, regex=None):
    d = CustomAttributeDefinition()
    d.id = 1
    d.attribute_key = key
    d.label = key.replace("_", " ").title()
    d.data_type = data_type
    d.required = required
    d.applies_to_product_type = applies_to
    d.validation_regex = regex
    d.column_name = attributes.column_name(key)
    return d


@pytest.fixture(autouse=True)
def isolated_registry():
    attributes.reset_for_tests()
    yield
    attributes.reset_for_tests()


@pytest.fixture
def custom_repo(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "custom_path", str(tmp_path))
    return tmp_path


class TestAttributeKeys:
    """The key is interpolated into DDL, so nothing but a plain identifier may get through."""

    @pytest.mark.parametrize("key", ["batch_number", "b", "shelf_life_days_2"])
    def test_identifier_keys_are_accepted(self, key):
        attributes.validate_definition(key, "STRING")

    @pytest.mark.parametrize("key", ["Batch", "1st", "batch number", "batch;DROP TABLE x", "", "a" * 51])
    def test_non_identifier_keys_are_rejected(self, key):
        with pytest.raises(FormCraftException, match="not a valid column name"):
            attributes.validate_definition(key, "STRING")

    def test_unknown_data_type_is_rejected(self):
        with pytest.raises(FormCraftException, match="Unknown attribute data type"):
            attributes.validate_definition("batch_number", "GEOMETRY")

    def test_columns_are_prefixed_so_they_cannot_shadow_a_core_column(self):
        assert attributes.column_name("name") == "x_name"
        assert "name" in Product.__table__.columns
        attributes.attach("name", "STRING", None)
        assert Product.__table__.columns["name"].type.length == 255
        assert "x_name" in Product.__table__.columns


class TestDefineAttribute:
    @patch("app.services.custom_attribute_service.custom_attribute_manifest")
    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_defining_an_attribute_alters_the_table(self, repo, manifest):
        d = definition("batch_number")
        repo.exists_by_attribute_key.return_value = False
        repo.save.return_value = d
        db = MagicMock()

        custom_attribute_service.define_attribute(db, d)

        ddl = str(db.execute.call_args[0][0])
        assert 'ALTER TABLE products ADD COLUMN IF NOT EXISTS "x_batch_number" VARCHAR(255)' == ddl
        assert attributes.is_attached("batch_number")

    @patch("app.services.custom_attribute_service.custom_attribute_manifest")
    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_defining_an_attribute_tracks_it_in_the_repo_manifest(self, repo, manifest):
        d = definition("shelf_life_days", data_type="NUMBER", applies_to="FINISHED_PRODUCT")
        repo.exists_by_attribute_key.return_value = False
        repo.save.return_value = d

        custom_attribute_service.define_attribute(MagicMock(), d)

        entry = manifest.upsert.call_args[0][0]
        assert entry["attributeKey"] == "shelf_life_days"
        assert entry["columnName"] == "x_shelf_life_days"
        assert entry["sqlType"] == "NUMERIC(18,6)"
        assert entry["appliesToProductType"] == "FINISHED_PRODUCT"

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_duplicate_key_is_rejected(self, repo):
        repo.exists_by_attribute_key.return_value = True
        with pytest.raises(FormCraftException, match="already defined"):
            custom_attribute_service.define_attribute(MagicMock(), definition("batch_number"))

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_bad_key_never_reaches_the_database(self, repo):
        with pytest.raises(FormCraftException, match="not a valid column name"):
            custom_attribute_service.define_attribute(MagicMock(), definition("Batch;DROP"))
        repo.save.assert_not_called()


class TestValidateAndApply:
    def setup_method(self):
        self.product = Product()
        self.product.id = 1
        self.product.product_type = "FINISHED_PRODUCT"

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_submitted_value_is_written_to_its_column(self, repo):
        d = definition("shelf_life_days", data_type="NUMBER")
        repo.find_all.return_value = [d]
        attributes.attach(d.attribute_key, d.data_type, None)
        self.product.custom_attributes = {"shelf_life_days": "12.5"}

        custom_attribute_service.validate_and_apply(MagicMock(), self.product)

        assert self.product.x_shelf_life_days == Decimal("12.5")
        assert self.product.custom_attributes == {"shelf_life_days": 12.5}

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_missing_required_attribute_is_rejected(self, repo):
        repo.find_all.return_value = [definition("batch_number", required=True)]
        self.product.custom_attributes = {}
        with pytest.raises(FormCraftException, match="is required"):
            custom_attribute_service.validate_and_apply(MagicMock(), self.product)

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_wrong_type_is_rejected(self, repo):
        repo.find_all.return_value = [definition("shelf_life_days", data_type="NUMBER")]
        self.product.custom_attributes = {"shelf_life_days": "not-a-number"}
        with pytest.raises(FormCraftException, match="must be of type NUMBER"):
            custom_attribute_service.validate_and_apply(MagicMock(), self.product)

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_value_failing_the_regex_is_rejected(self, repo):
        repo.find_all.return_value = [definition("batch_number", regex=r"^[A-Z]{2}-\d{4}$")]
        self.product.custom_attributes = {"batch_number": "nope"}
        with pytest.raises(FormCraftException, match="does not match the required format"):
            custom_attribute_service.validate_and_apply(MagicMock(), self.product)

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_undefined_key_is_rejected_rather_than_silently_stored(self, repo):
        repo.find_all.return_value = []
        self.product.custom_attributes = {"invented": "x"}
        with pytest.raises(FormCraftException, match="not a custom attribute defined"):
            custom_attribute_service.validate_and_apply(MagicMock(), self.product)

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_attribute_for_another_product_type_is_ignored(self, repo):
        repo.find_all.return_value = [definition("pallet_type", required=True, applies_to="PACKAGING")]
        self.product.custom_attributes = {}
        custom_attribute_service.validate_and_apply(MagicMock(), self.product)

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_update_without_attributes_leaves_existing_values_alone(self, repo):
        d = definition("batch_number")
        repo.find_all.return_value = [d]
        attributes.attach(d.attribute_key, d.data_type, None)
        self.product.x_batch_number = "AB-1234"

        custom_attribute_service.validate_and_apply(MagicMock(), self.product)

        assert self.product.x_batch_number == "AB-1234"

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_cleared_value_nulls_the_column(self, repo):
        d = definition("batch_number")
        repo.find_all.return_value = [d]
        attributes.attach(d.attribute_key, d.data_type, None)
        self.product.x_batch_number = "AB-1234"
        self.product.custom_attributes = {"batch_number": ""}

        custom_attribute_service.validate_and_apply(MagicMock(), self.product)

        assert self.product.x_batch_number is None


class TestManifest:
    def test_no_repo_mounted_means_nothing_to_track(self, monkeypatch):
        monkeypatch.setattr(settings, "custom_path", "")
        assert custom_attribute_manifest.manifest_path() is None
        assert custom_attribute_manifest.load() == []
        assert custom_attribute_manifest.upsert({"attributeKey": "x"}) is None

    def test_manifest_is_created_at_the_repo_root_when_absent(self, custom_repo):
        path = custom_attribute_manifest.upsert({"attributeKey": "batch_number"})
        assert path == custom_repo / "custom-product-attributes.json"
        assert json.loads(path.read_text())["attributes"] == [{"attributeKey": "batch_number"}]

    def test_an_existing_manifest_is_appended_to(self, custom_repo):
        existing = custom_repo / "nordic-custom-products-attributes.json"
        existing.write_text(json.dumps({"attributes": [{"attributeKey": "batch_number"}]}))

        path = custom_attribute_manifest.upsert({"attributeKey": "shelf_life_days"})

        assert path == existing
        keys = [e["attributeKey"] for e in json.loads(path.read_text())["attributes"]]
        assert keys == ["batch_number", "shelf_life_days"]

    def test_redefining_a_key_replaces_its_entry(self, custom_repo):
        custom_attribute_manifest.upsert({"attributeKey": "batch_number", "label": "Old"})
        custom_attribute_manifest.upsert({"attributeKey": "batch_number", "label": "New"})
        entries = custom_attribute_manifest.load()
        assert entries == [{"attributeKey": "batch_number", "label": "New"}]

    def test_unreadable_manifest_is_ignored_rather_than_fatal(self, custom_repo):
        (custom_repo / "custom-product-attributes.json").write_text("{ not json")
        assert custom_attribute_manifest.load() == []


class TestManifestAdoption:
    """Pointing a fresh database at a client's repo has to rebuild their columns."""

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_manifest_entries_become_definitions(self, repo, custom_repo):
        custom_attribute_manifest.upsert({
            "attributeKey": "shelf_life_days", "label": "Shelf Life", "dataType": "NUMBER",
            "required": True, "appliesToProductType": "FINISHED_PRODUCT",
        })
        repo.exists_by_attribute_key.return_value = False

        custom_attribute_service._adopt_manifest(MagicMock())

        saved = repo.save.call_args[0][1]
        assert saved.attribute_key == "shelf_life_days"
        assert saved.data_type == "NUMBER"
        assert saved.required is True
        assert saved.column_name == "x_shelf_life_days"

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_already_known_attributes_are_not_duplicated(self, repo, custom_repo):
        custom_attribute_manifest.upsert({"attributeKey": "batch_number", "dataType": "STRING"})
        repo.exists_by_attribute_key.return_value = True

        custom_attribute_service._adopt_manifest(MagicMock())

        repo.save.assert_not_called()

    @patch("app.services.custom_attribute_service.custom_attribute_definition_repository")
    def test_a_hand_edited_manifest_cannot_inject_a_column_name(self, repo, custom_repo):
        custom_attribute_manifest.upsert({"attributeKey": 'evil"; DROP TABLE products; --', "dataType": "STRING"})
        repo.exists_by_attribute_key.return_value = False

        custom_attribute_service._adopt_manifest(MagicMock())

        repo.save.assert_not_called()
