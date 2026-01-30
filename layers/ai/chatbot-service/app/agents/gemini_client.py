"""Production-ready Gemini API client with Google Search grounding."""

import os
import json
import re
from typing import Optional
from google import genai
from google.genai import types

from app.core.logging import get_logger
from app.core.exceptions import AIServiceError
from app.core.config import settings

logger = get_logger(__name__)


class GeminiClient:
    """Simplified Gemini client with Google Search grounding."""
    
    MODEL_NAME = "gemini-2.5-flash"
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Gemini client."""
        try:
            self.api_key = api_key or settings.gemini_api_key
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not found")
            
            self.client = genai.Client(api_key=self.api_key)
            logger.info("gemini_client_initialized", model=self.MODEL_NAME)
        except Exception as e:
            logger.error("gemini_init_failed", error=str(e))
            raise AIServiceError(f"Failed to initialize Gemini client: {str(e)}")
    
    def generate(self, prompt: str, system_prompt: str) -> dict:
        """
        Generate response with enforced JSON output.
        
        Args:
            prompt: User query
            system_prompt: System instructions for response format
            
        Returns:
            Parsed JSON response dict
        """
        try:
            logger.info("generating_response", prompt_length=len(prompt))
            
            # Define JSON schema for response
            response_schema = types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "data": types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "coins": types.Schema(
                                type=types.Type.ARRAY,
                                items=types.Schema(type=types.Type.STRING)
                            ),
                            "timeframe": types.Schema(
                                type=types.Type.STRING,
                                enum=["1d", "1m", "3m", "1y", "all"]
                            ),
                            "explanation": types.Schema(type=types.Type.STRING)
                        },
                        required=["coins", "timeframe", "explanation"]
                    ),
                    "suggested_next_prompts": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(type=types.Type.STRING)
                    )
                },
                required=["data", "suggested_next_prompts"]
            )
            
            # Configure generation with JSON schema and system instruction
            config = types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
                response_mime_type="application/json",
                response_schema=response_schema,
                system_instruction=system_prompt
            )
            
            # Generate content with enforced JSON format
            response = self.client.models.generate_content(
                model=self.MODEL_NAME,
                contents=prompt,
                config=config,
            )
            
            # Parse JSON response
            json_data = json.loads(response.text)
            
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
