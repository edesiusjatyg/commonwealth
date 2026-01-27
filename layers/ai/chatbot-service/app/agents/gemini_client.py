"""Production-ready Gemini API client with Google Search grounding."""

import os
import json
import re
from typing import Optional
from google import genai
from google.genai import types

from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)


class GeminiClient:
    """Simplified Gemini client with Google Search grounding."""
    
    MODEL_NAME = "gemini-2.5-flash"
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client."""
        try:
            self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not found")
            
            self.client = genai.Client(api_key=self.api_key)
            logger.info("gemini_client_initialized", model=self.MODEL_NAME)
        except Exception as e:
            logger.error("gemini_init_failed", error=str(e))
            raise AIServiceError(f"Failed to initialize Gemini client: {str(e)}")
    
    def generate(self, prompt: str, response_format: str) -> dict:
        """
        Generate response with Google Search grounding.
        
        Args:
            prompt: User query
            response_format: Expected JSON format structure
            
        Returns:
            Parsed JSON response dict
        """
        try:
            logger.info("generating_response", prompt_length=len(prompt))
            
            # Configure Google Search grounding tool
            grounding_tool = types.Tool(google_search=types.GoogleSearch())
            
            config = types.GenerateContentConfig(
                tools=[grounding_tool],
                temperature=0.7,
                max_output_tokens=2048,
            )
            
            # Generate content with structured format
            full_prompt = f"""
The user asked you: {prompt}

You need to respond with the following JSON format:
{response_format}

Important:
- Search the web for current information using Google Search
- Provide accurate, up-to-date data
- Format the response as valid JSON
- Keep explanation concise (max 200 words)
- In the "sources" array, include actual web sources you found (with "name" and "link" fields)
- If you found web results, each source must have: {{"name": "Source Name", "link": "https://actual-url.com"}}
- Suggest 3 relevant follow-up prompts (max 3 words each - be very concise)
"""
            
            response = self.client.models.generate_content(
                model=self.MODEL_NAME,
                contents=full_prompt,
                config=config,
            )
            
            # Extract JSON from response
            json_data = self._extract_json(response.text)
            
            logger.info("response_generated", has_data=bool(json_data))
            return json_data
            
        except Exception as e:
            logger.error("generation_failed", error=str(e))
            raise AIServiceError(f"Failed to generate response: {str(e)}")
    
    def _extract_json(self, text: str) -> dict:
        """Extract and parse JSON from response text."""
        try:
            # Remove markdown code blocks if present
            text = text.strip()
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            text = text.strip()
            
            # Try direct JSON parse
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                # Try to find JSON object in text
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                raise
                
        except Exception as e:
            logger.error("json_extraction_failed", error=str(e), text_preview=text[:200])
            raise AIServiceError(f"Failed to parse JSON response: {str(e)}")
