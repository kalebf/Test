def test_dashboard_summary_unauthorized(client):
    response = client.get("/dashboard/summary")
    assert response.status_code == 401


def test_dashboard_recent_purchases_unauthorized(client):
    response = client.get("/dashboard/recent-purchases")
    assert response.status_code == 401
