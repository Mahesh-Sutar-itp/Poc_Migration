from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_snake


class BaseSchema(BaseModel):
    """
    Base for all response schemas.

    Field names are camelCase (matching JSON / Java conventions).
    The AliasGenerator maps them to snake_case validation aliases so that
    `model_validate(orm_obj, from_attributes=True)` reads the correct
    SQLAlchemy column attributes (e.g. `product_type` for field `productType`).
    """

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=AliasGenerator(validation_alias=to_snake),
    )
