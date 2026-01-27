"""Unit tests for JSON extraction and cleaning in GeminiClient."""

import pytest
import json
from app.agents.gemini_client import GeminiClient
from app.models.responses import ChatData, ChartConfig, Source
from app.models.enums import ChartType, SourceType


class TestJSONExtraction:
    """Test JSON extraction and cleaning functionality."""
    
    def setup_method(self):
        """Set up test fixtures."""
        # Don't initialize GeminiClient (requires API key)
        # Just create instance to test the cleaning methods
        self.client = GeminiClient()
    
    def test_clean_json_with_control_characters(self):
        """Test cleaning JSON with control characters."""
        # Malformed JSON with control character
        malformed = '{"test": "value\x00"}'
        cleaned = self.client._clean_json_string(malformed)
        
        # Should remove control character
        assert '\x00' not in cleaned
        data = json.loads(cleaned)
        assert data['test'] == 'value'
    
    def test_extract_json_from_markdown(self):
        """Test extracting JSON from markdown code blocks."""
        text = '''Here is the response:
```json
{
  "chart_config": {
    "coins": ["BTC"],
    "type": "single_chart",
    "timeframe": "7d"
  },
  "explanation": "Test",
  "sources": [],
  "suggested_prompts": ["a", "b", "c"]
}
```
'''
        cleaned = self.client._clean_json_string(text)
        data = json.loads(cleaned)
        assert data['chart_config']['coins'] == ['BTC']
    
    def test_extract_first_valid_json_object(self):
        """Test extracting first valid JSON when response has duplicates."""
        # Simulating the Gemini bug where response is duplicated
        text = '''Some text before
{
  "chart_config": {
    "coins": [],
    "type": "none",
    "timeframe": null
  },
  "explanation": "First response",
  "sources": [],
  "suggested_prompts": ["a", "b", "c"]
}
Extra text: {"chart_config": {"coins": []}}
'''
        cleaned = self.client._clean_json_string(text)
        data = json.loads(cleaned)
        assert data['explanation'] == 'First response'
    
    def test_validate_extracted_json_into_chatdata(self):
        """Test that extracted JSON can be validated into ChatData."""
        valid_json = json.dumps({
            "chart_config": {
                "coins": ["BTC", "ETH"],
                "type": "comparison",
                "timeframe": "7d"
            },
            "explanation": "Bitcoin and Ethereum comparison",
            "sources": [
                {
                    "type": "news",
                    "name": "CoinDesk",
                    "url": "https://coindesk.com"
                }
            ],
            "suggested_prompts": [
                "Tell me more",
                "What about other coins?",
                "Show me the chart"
            ]
        })
        
        chat_data = self.client._extract_and_validate_json(valid_json)
        
        assert isinstance(chat_data, ChatData)
        assert len(chat_data.chart_config.coins) == 2
        assert chat_data.chart_config.type == ChartType.COMPARISON
        assert len(chat_data.sources) == 1
        assert len(chat_data.suggested_prompts) == 3
    
    def test_handle_malformed_json_with_control_chars(self):
        """Test handling real Gemini response with control characters."""
        # Simulating actual Gemini bug from test output
        malformed = '''{
  "chart_config": {
    "coins": [],
    "type": "none",
    "timeframe": null
  },
  "explanation": "Test response\x0C",
  "sources": [
    {
      "type": "news",
      "name": "Test Source",
      "url": "https://example.com"
    }
  ],
  "suggested_prompts": ["a", "b", "c"]
}'''
        
        # Should clean and validate successfully
        chat_data = self.client._extract_and_validate_json(malformed)
        
        assert isinstance(chat_data, ChatData)
        assert chat_data.chart_config.type == ChartType.NONE
        assert len(chat_data.sources) == 1
        # Control character should be removed from explanation
        assert '\x0C' not in chat_data.explanation
    
    def test_handle_duplicate_json_response(self):
        """Test handling duplicate JSON (Gemini bug)."""
        # This mimics the actual error we saw
        duplicate = '''{
  "chart_config": {
    "coins": [],
    "type": "none",
    "timeframe": null
  },
  "explanation": "First complete response",
  "sources": [
    {
      "type": "internal",
      "name": "Test Source",
      "url": null
    }
  ],
  "suggested_prompts": ["a", "b", "c"]
}{"chart_config": {"coins": [], "type": "none"'''
        
        # Should extract first complete object
        chat_data = self.client._extract_and_validate_json(duplicate)
        
        assert isinstance(chat_data, ChatData)
        assert chat_data.explanation == "First complete response"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
