"""Gemini AI service for AI-powered features."""
import os
import logging
from typing import Optional, Dict, Any, List
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiAIService:
    """Service for Google Gemini AI integration."""
    
    def __init__(self):
        """Initialize Gemini AI with API key."""
        api_key = os.getenv('GEMINI_AI_API_KEY')
        if not api_key or api_key == 'your_gemini_ai_api_key_here':
            logger.warning('Gemini AI API key not configured')
            self.enabled = False
            return
        
        try:
            genai.configure(api_key=api_key)
            self.model_name = os.getenv('GEMINI_AI_MODEL', 'gemini-pro')
            self.model = genai.GenerativeModel(self.model_name)
            self.enabled = True
            logger.info(f'Gemini AI initialized with model: {self.model_name}')
        except Exception as e:
            logger.error(f'Failed to initialize Gemini AI: {str(e)}')
            self.enabled = False
    
    def generate_product_description(
        self,
        product_name: str,
        category: str,
        weight: float,
        gold_purity: str,
        additional_details: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate product description using AI.
        
        Args:
            product_name: Name of the product
            category: Product category (e.g., Necklace, Ring)
            weight: Weight in grams
            gold_purity: Gold purity (e.g., 22K, 18K)
            additional_details: Any additional details
        
        Returns:
            Generated description or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            prompt = f"""Generate an elegant and appealing product description for a jewelry item with the following details:

Product Name: {product_name}
Category: {category}
Weight: {weight}g
Gold Purity: {gold_purity}
{f'Additional Details: {additional_details}' if additional_details else ''}

Write a professional, engaging description (2-3 sentences) that highlights the beauty, craftsmanship, and value of this jewelry piece. Focus on traditional Indian jewelry aesthetics."""

            response = self.model.generate_content(prompt)
            description = response.text.strip()
            logger.info(f'Generated description for {product_name}')
            return description
        
        except Exception as e:
            logger.error(f'Failed to generate product description: {str(e)}')
            return None
    
    def generate_product_recommendations(
        self,
        user_preferences: Dict[str, Any],
        available_products: List[Dict[str, Any]],
        limit: int = 5
    ) -> Optional[List[str]]:
        """
        Generate personalized product recommendations.
        
        Args:
            user_preferences: User's preferences and purchase history
            available_products: List of available products
            limit: Number of recommendations to generate
        
        Returns:
            List of product IDs or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            products_summary = "\n".join([
                f"- {p['name']} ({p['category']}, {p['price']} INR)"
                for p in available_products[:20]  # Limit to avoid token limits
            ])
            
            prompt = f"""Based on the following user preferences and available products, recommend the top {limit} products:

User Preferences:
{user_preferences}

Available Products:
{products_summary}

Provide only the product names as a comma-separated list."""

            response = self.model.generate_content(prompt)
            recommendations = response.text.strip()
            logger.info('Generated product recommendations')
            return recommendations.split(',')
        
        except Exception as e:
            logger.error(f'Failed to generate recommendations: {str(e)}')
            return None
    
    def answer_customer_query(self, query: str, context: Optional[str] = None) -> Optional[str]:
        """
        Answer customer queries using AI.
        
        Args:
            query: Customer's question
            context: Additional context about the store/products
        
        Returns:
            AI-generated answer or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            context_text = context or """
You are a helpful customer service assistant for Swati Jewellers, a traditional Indian jewelry store.
We specialize in gold, silver, and diamond jewelry including necklaces, rings, earrings, bangles, and bridal sets.
We offer 916 HM certified gold with authenticity guarantee.
We accept cash, card, UPI, and also offer Khata (credit) facility for regular customers.
"""
            
            prompt = f"""{context_text}

Customer Question: {query}

Provide a helpful, professional, and friendly response."""

            response = self.model.generate_content(prompt)
            answer = response.text.strip()
            logger.info('Generated customer query response')
            return answer
        
        except Exception as e:
            logger.error(f'Failed to answer customer query: {str(e)}')
            return None
    
    def summarize_reviews(self, reviews: List[str]) -> Optional[str]:
        """
        Summarize customer reviews.
        
        Args:
            reviews: List of customer reviews
        
        Returns:
            Summary of reviews or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            reviews_text = "\n".join([f"- {review}" for review in reviews[:10]])
            
            prompt = f"""Summarize the following customer reviews in 2-3 sentences, highlighting the main positive and negative points:

Reviews:
{reviews_text}

Provide a balanced summary."""

            response = self.model.generate_content(prompt)
            summary = response.text.strip()
            logger.info('Generated review summary')
            return summary
        
        except Exception as e:
            logger.error(f'Failed to summarize reviews: {str(e)}')
            return None
    
    def generate_seo_keywords(
        self,
        product_name: str,
        category: str,
        description: str
    ) -> Optional[List[str]]:
        """
        Generate SEO keywords for a product.
        
        Args:
            product_name: Product name
            category: Product category
            description: Product description
        
        Returns:
            List of SEO keywords or None if failed
        """
        if not self.enabled:
            return None
        
        try:
            prompt = f"""Generate 10 SEO keywords for the following jewelry product:

Product: {product_name}
Category: {category}
Description: {description}

Provide keywords as a comma-separated list, focusing on Indian jewelry market."""

            response = self.model.generate_content(prompt)
            keywords = response.text.strip().split(',')
            keywords = [k.strip() for k in keywords]
            logger.info(f'Generated SEO keywords for {product_name}')
            return keywords
        
        except Exception as e:
            logger.error(f'Failed to generate SEO keywords: {str(e)}')
            return None


# Global instance
gemini_ai_service = GeminiAIService()
