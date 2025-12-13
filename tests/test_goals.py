def test_get_goals_unauthorized(client):
    response = client.get("/goals/")
    assert response.status_code == 401


def test_create_goal_unauthorized(client):
    response = client.post(
        "/goals/",
        json={
            "name": "Test Goal",
            "type": "personal",
            "target_amount": 1000,
            "current_amount": 0,
            "target_date": "2025-12-31"
        }
    )
    assert response.status_code == 401
