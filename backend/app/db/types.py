import uuid
from sqlalchemy import TypeDecorator, CHAR, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID


class GUID(TypeDecorator):
    """Platform-independent GUID type that uses CHAR(32) on SQLite and UUID on PostgreSQL."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            if dialect.name == "postgresql":
                return str(value)
            else:
                return value.hex
        if not isinstance(value, str):
            raise TypeError(f"Expected UUID or str, got {type(value)}")
        if dialect.name == "postgresql":
            return value
        else:
            return uuid.UUID(value).hex

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return uuid.UUID(value) if isinstance(value, str) else value
        else:
            return uuid.UUID(bytes=bytes.fromhex(value)) if isinstance(value, str) else value
