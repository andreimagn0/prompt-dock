API = "/api/v1/auth"
NEW_USER = {"username": "jay", "email": "jay@example.com", "password": "secret123"}


def test_register_creates_user(client):
    response = client.post(f"{API}/register", json=NEW_USER)

    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "jay"
    assert body["email"] == "jay@example.com"
    assert "password" not in body
    assert "password_hash" not in body


def test_register_duplicate_username_or_email(client):
    client.post(f"{API}/register", json=NEW_USER)

    same_username = client.post(f"{API}/register", json={**NEW_USER, "email": "other@example.com"})
    same_email = client.post(f"{API}/register", json={**NEW_USER, "username": "other"})

    assert same_username.status_code == 409
    assert same_email.status_code == 409


def test_register_invalid_data(client):
    bad_email = client.post(f"{API}/register", json={**NEW_USER, "email": "not-an-email"})
    bad_username = client.post(f"{API}/register", json={**NEW_USER, "username": "a@b"})

    assert bad_email.status_code == 422
    assert bad_username.status_code == 422


def test_login_with_username_or_email(client):
    client.post(f"{API}/register", json=NEW_USER)

    by_username = client.post(f"{API}/login", json={"identifier": "jay", "password": "secret123"})
    by_email = client.post(f"{API}/login", json={"identifier": "jay@example.com", "password": "secret123"})

    assert by_username.status_code == 200
    assert by_email.status_code == 200
    assert by_username.json()["token_type"] == "bearer"
    assert by_username.json()["access_token"]


def test_login_wrong_password(client):
    client.post(f"{API}/register", json=NEW_USER)

    response = client.post(f"{API}/login", json={"identifier": "jay", "password": "wrong"})

    assert response.status_code == 401


def test_login_unknown_user(client):
    response = client.post(f"{API}/login", json={"identifier": "nobody", "password": "secret123"})

    assert response.status_code == 401