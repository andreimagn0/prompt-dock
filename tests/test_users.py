API = "/api/v1/users"


def test_get_me(client, auth_headers):
    response = client.get(f"{API}/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json()["username"] == "jay"
    assert response.json()["email"] == "jay@example.com"


def test_get_me_without_token(client):
    response = client.get(f"{API}/me")

    assert response.status_code == 401


def test_get_me_with_bad_token(client):
    response = client.get(f"{API}/me", headers={"Authorization": "Bearer not-a-real-token"})

    assert response.status_code == 401


def test_update_me(client, auth_headers):
    response = client.put(
        f"{API}/me",
        headers=auth_headers,
        json={"current_password": "secret123", "username": "jay2"},
    )

    assert response.status_code == 200
    assert response.json()["username"] == "jay2"


def test_update_me_wrong_password(client, auth_headers):
    response = client.put(f"{API}/me", headers=auth_headers, json={"current_password": "wrong", "username": "jay2"})

    assert response.status_code == 401


def test_update_me_username_taken(client, auth_headers):
    client.post("/api/v1/auth/register", json={"username": "taken", "email": "taken@example.com", "password": "pw"})

    response = client.put(f"{API}/me", headers=auth_headers, json={"current_password": "secret123", "username": "taken"})

    assert response.status_code == 409


def test_delete_me(client, auth_headers):
    response = client.delete(f"{API}/me", headers=auth_headers)

    assert response.status_code == 200
    assert client.get(f"{API}/me", headers=auth_headers).status_code == 401


def test_public_profile_hides_email(client, auth_headers):
    response = client.get(f"{API}/1")

    assert response.status_code == 200
    assert response.json()["username"] == "jay"
    assert "email" not in response.json()


def test_public_profile_not_found(client):
    response = client.get(f"{API}/999")

    assert response.status_code == 404