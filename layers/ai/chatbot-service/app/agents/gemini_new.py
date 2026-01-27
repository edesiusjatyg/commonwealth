"""Simplified Gemini API client with Google Search grounding."""

import asyncio
import re
import json
from google import genai
from google.genai import types

from app.core.config import settings
from app.core.logging import get_logger
from app.core.exceptions import AIServiceError

logger = get_logger(__name__)


class GeminiClient:
    """Simple Gemini client with Google Search grounding."""
    
    MODEL_NAME = "gemini-2.5-flash"
    
    def __init__(self):
        """Initialize Gemini client."""
        try:
            self.client = genai.Client(api_key=settings.gemini_api_key)
            logger.info("gemini_initialized")
        except Exception as e:
            logger.error("gemini_init_failed", error=str(e))
            raise AIServiceError(f"Gemini init failed: {str(e)}")
    
    async def generate(self, prompt: str, use_search: bool = True) -> dict:
        """
        Generate response with optional Google Search grounding.
        
        Args:
            prompt: Complete prompt with instructions
            use_search: Enable Google Search grounding
            
        Returns:
            Dict with parsed JSON response
        """
        try:
            logger.info("generating", use_search=use_search)
            
            # Configure tools
            grounding_tool = types.Tool(google_search=types.GoogleSearch())
            config = types.GenerateContentConfig(
                tools=[grounding_tool] if use_search else None,
                temperature=0.7,
                max_output_tokens=2048,
            )
            
            # Generate response
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.MODEL_NAME,
                contents=prompt,
                config=config,
            )
            
            if not response.text:
                raise AIServiceError("Empty response from Gemini")
            
            # Log grounding metadata if available
            if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
                self._log_grounding_metadata(response.grounding_metadata)
            
            # Parse JSON from response
            result = self._extract_json(response.text)
            
            logger.info("generation_success")
            return result
                
        except Exception as e:
            logger.error("generation_failed", error=str(e), exc_info=True)
            raise AIServiceError(f"Generation failed: {str(e)}")
    
    def _log_grounding_metadata(self, metadata) -> None:
        """Log grounding metadata from Google Search."""
        try:
            if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                logger.info("search_grounding_used", chunks=len(metadata.grounding_chunks))
        except Exception as e:
            logger.warning("grounding_log_error", error=str(e))
    
    def _extract_json(self, text: str) -> dict:
        """
        Extract and parse JSON from response text.
        
        Args:
            text: Raw response text
            
        Returns:
            Parsed JSON dict
        """
        # Clean control characters
        cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', text)
        
        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', cleaned, re.DOTALL)
        if json_match:
            cleaned = json_match.group(1)
        else:
            # Find first complete JSON object
            start_idx = cleaned.find('{')
            if start_idx != -1:
                # Find matching closing brace
                brace_count = 0
                for i in range(start_idx, len(cleaned)):
                    if cleaned[i] == '{':
                        brace_count += 1
                    elif cleaned[i] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            cleaned = cleaned[start_idx:i+1]
                            break
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error("json_parse_failed", error=str(e), text=cleaned[:500])
            raise AIServiceError(f"Invalid JSON response: {str(e)}")
