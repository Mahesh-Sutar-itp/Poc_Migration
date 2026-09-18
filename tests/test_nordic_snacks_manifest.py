import json
import re

import pytest

from app.sdk.attributes import _KEY_RE


EXPECTED_SCHEMA = "formcraft/custom-product-attributes/v1"
EXPECTED_TABLE = "products"
MANIFEST_PATH = "custom-product-attributes.json"


@pytest.fixture
def manifest_data():
    with open(MANIFEST_PATH) as f:
        return json.load(f)


class TestManifestEnvelope:
    def test_schema_key_present(self, manifest_data):
        assert manifest_data["schema"] == EXPECTED_SCHEMA

    def test_table_key_present(self, manifest_data):
        assert manifest_data["table"] == EXPECTED_TABLE

    def test_attributes_is_a_list(self, manifest_data):
        assert isinstance(manifest_data["attributes"], list)

    def test_two_attributes_present(self, manifest_data):
        assert len(manifest_data["attributes"]) == 2


class TestManifestAttributes:
    def test_batch_no_attribute(self, manifest_data):
        attr = manifest_data["attributes"][0]
        assert attr["attributeKey"] == "batch_no"
        assert attr["label"] == "test Label"
        assert attr["dataType"] == "STRING"
        assert attr["required"] is True

    def test_test_3_attribute(self, manifest_data):
        attr = manifest_data["attributes"][1]
        assert attr["attributeKey"] == "test_3"
        assert attr["label"] == "test 3"
        assert attr["dataType"] == "STRING"
        assert attr["required"] is True

    @pytest.mark.parametrize("idx", [0, 1])
    def test_attribute_keys_pass_key_regex(self, manifest_data, idx):
        key = manifest_data["attributes"][idx]["attributeKey"]
        assert _KEY_RE.match(key), f"attributeKey '{key}' does not match _KEY_RE"

    @pytest.mark.parametrize("idx", [0, 1])
    def test_data_types_are_valid(self, manifest_data, idx):
        allowed = {"STRING", "NUMBER", "BOOLEAN", "DATE"}
        dt = manifest_data["attributes"][idx]["dataType"]
        assert dt in allowed, f"dataType '{dt}' not in {allowed}"


class TestManifestFromTmpPath:
    def test_manifest_loads_from_tmp_path(self, tmp_path):
        manifest = {
            "schema": EXPECTED_SCHEMA,
            "table": EXPECTED_TABLE,
            "attributes": [
                {"attributeKey": "batch_no", "label": "test Label", "dataType": "STRING", "required": True},
                {"attributeKey": "test_3", "label": "test 3", "dataType": "STRING", "required": True},
            ],
        }
        path = tmp_path / "custom-product-attributes.json"
        path.write_text(json.dumps(manifest))
        loaded = json.loads(path.read_text())
        assert loaded["schema"] == EXPECTED_SCHEMA
        assert len(loaded["attributes"]) == 2
