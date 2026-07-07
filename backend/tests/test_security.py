from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_roundtrip() -> None:
    hashed = hash_password("s3cret-pass")
    assert hashed != "s3cret-pass"
    assert verify_password("s3cret-pass", hashed)
    assert not verify_password("wrong-pass", hashed)


def test_verify_password_bad_hash_is_false() -> None:
    assert not verify_password("anything", "not-a-bcrypt-hash")


def test_access_token_roundtrip() -> None:
    token = create_access_token(42)
    assert decode_token(token, expected_type="access") == 42


def test_token_type_is_enforced() -> None:
    access = create_access_token(42)
    refresh = create_refresh_token(42)
    assert decode_token(access, expected_type="refresh") is None
    assert decode_token(refresh, expected_type="access") is None
    assert decode_token(refresh, expected_type="refresh") == 42


def test_garbage_token_is_rejected() -> None:
    assert decode_token("garbage.token.value", expected_type="access") is None
