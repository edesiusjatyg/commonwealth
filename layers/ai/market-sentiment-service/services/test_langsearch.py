import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import httpx

# Assuming your script is saved as 'langsearch_client.py'
from langsearch_client import LangSearchClient

@pytest.mark.asyncio
async def test_search_success_with_sanitization():
    """
    Test the search functionality with a successful API response.
    Verifies payload construction, header authorization, and text sanitization.
    """
    # --- SETUP ---
    api_key = "test_secret_key"
    client = LangSearchClient(api_key)
    token = "BTC"
    timeframe = "7d"  # This should map to "oneWeek" and specific query template
    
    # Mock data simulating a raw response from LangSearch
    # We include some "dirty" characters (HTML tags) to test sanitization
    mock_api_response = {
        "results": [
            {
                "title": "Bitcoin Rally <b>Confirmed</b>",
                "snippet": "Short snippet here.",
                "summary": "Bitcoin price has <script>alert('bad')</script> surged past $100k.",
                "url": "https://crypto.news/btc-rally",
                "date": "2024-03-20"
            }
        ]
    }

    # --- MOCKING ---
    # We patch httpx.AsyncClient to prevent actual network calls
    with patch("httpx.AsyncClient") as MockClientClass:
        # Create a mock instance for the context manager (__aenter__)
        mock_client_instance = AsyncMock()
        MockClientClass.return_value.__aenter__.return_value = mock_client_instance

        # Setup the mock response object
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_api_response
        mock_client_instance.post.return_value = mock_response

        # --- EXECUTION ---
        texts, sources = await client.search(token, timeframe, max_results=5)

        # --- ASSERTIONS ---

        # 1. Verify API Request Structure
        mock_client_instance.post.assert_called_once()
        
        # Get arguments passed to client.post
        call_args = mock_client_instance.post.call_args
        url_arg = call_args[0][0]
        kwargs = call_args[1]
        
        # Check URL
        assert url_arg == "https://api.langsearch.com/v1/web-search"
        
        # Check Headers (Auth)
        assert kwargs["headers"]["Authorization"] == f"Bearer {api_key}"
        
        # Check Payload Logic
        expected_payload = {
            "query": "BTC crypto narrative past week", # '7d' triggers this specific template
            "freshness": "oneWeek",                  # '7d' triggers this filter
            "summary": True,
            "count": 5
        }
        assert kwargs["json"] == expected_payload

        # 2. Verify Data Processing & Sanitization
        assert len(texts) == 1
        assert len(sources) == 1

        result_text = texts[0]
        result_source = sources[0]

        # Verify HTML tags were stripped (Sanitization check)
        # <b> and <script> should be removed, but content kept safely
        assert "<b>" not in result_text
        assert "<script>" not in result_text
        assert "Confirmed" in result_text
        assert "surged past" in result_text
        
        # Verify Source extraction
        assert result_source["url"] == "https://crypto.news/btc-rally"
        assert result_source["date"] == "2024-03-20"