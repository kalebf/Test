def test_login_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "doesnotexist@test.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 400


def test_get_profile_unauthorized(client):
    response = client.get("/auth/profile")
    assert response.status_code == 401
