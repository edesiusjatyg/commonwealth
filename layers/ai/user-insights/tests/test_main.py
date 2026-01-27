from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock services before importing main
sys.modules['services.insight_generator'] = MagicMock()
sys.modules['services.comparison_service'] = MagicMock()
sys.modules['app.database'] = MagicMock()

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_get_user_insight_not_found():
    with patch("app.main.insight_generator.get_latest", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        response = client.get("/insights/user123")
        assert response.status_code == 404
