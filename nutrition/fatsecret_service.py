import os
from dotenv import load_dotenv
import requests
from django.conf import settings
import json
import base64
import time
from django.core.cache import cache


class FatSecretService:
    def __init__(self):
        # Only load .env in development
        if os.getenv("RENDER") is None:
            load_dotenv()
        
        self.consumer_client = os.getenv("FATSECRET_CLIENT") or os.environ.get("FATSECRET_CLIENT")
        self.consumer_secret = os.getenv("FATSECRET_CLIENT_SECRET") or os.environ.get("FATSECRET_CLIENT_SECRET")
        
        if not self.consumer_client or not self.consumer_secret:
            raise ValueError("FatSecret credentials (FATSECRET_CLIENT, FATSECRET_CLIENT_SECRET) are not set in environment variables")
        
        self.token_url = "https://oauth.fatsecret.com/connect/token"
        self.search_url = "https://platform.fatsecret.com/rest/foods/search/v1"
        self.food_url = "https://platform.fatsecret.com/rest/food/v4"

        # Cache keys for storing token data
        self.token_cache_key = "fatsecret_access_token"
        self.token_expiry_cache_key = "fatsecret_token_expires_at"

    def _is_token_valid(self):
        """Check if current token is still valid"""
        access_token = cache.get(self.token_cache_key)
        token_expires_at = cache.get(self.token_expiry_cache_key)

        if not access_token:
            print("No access token in cache")
            return False

        if not token_expires_at:
            print("No expiration time in cache")
            return False

        # Check if token expires in the next 60 seconds (buffer time)
        current_time = time.time()
        if current_time >= (token_expires_at - 60):
            print(
                f"Token expired or expiring soon. Current: {current_time}, Expires: {token_expires_at}"
            )
            return False

        print(
            f"Token is still valid. Expires in {token_expires_at - current_time:.0f} seconds"
        )
        return True

    def _get_access_token(self):
        """Get OAuth 2.0 access token from FatSecret"""
        # Check if we already have a valid token in cache
        if self._is_token_valid():
            access_token = cache.get(self.token_cache_key)
            print("Using cached access token")
            return access_token

        print("Requesting new access token...")

        if not self.consumer_client or not self.consumer_secret:
            raise Exception(
                "FatSecret client credentials not found in environment variables"
            )

        # Create basic auth header
        credentials = f"{self.consumer_client}:{self.consumer_secret}"
        credentials_b64 = base64.b64encode(credentials.encode("utf-8")).decode("ascii")

        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": f"Basic {credentials_b64}",
        }

        data = {"grant_type": "client_credentials", "scope": "basic"}

        try:
            response = requests.post(
                self.token_url, headers=headers, data=data, timeout=30
            )

            print(f"Token Request Status: {response.status_code}")

            if response.status_code != 200:
                raise Exception(
                    f"Token request failed with status {response.status_code}: {response.text}"
                )

            token_data = response.json()
            access_token = token_data["access_token"]

            # Calculate expiration time (expires_in is in seconds)
            expires_in = token_data.get(
                "expires_in", 3600
            )  # Default to 1 hour if not provided
            token_expires_at = time.time() + expires_in

            # Store token and expiration in cache
            # Cache for slightly less time than actual expiration to be safe
            cache_timeout = expires_in - 120  # 2 minutes before actual expiration
            cache.set(self.token_cache_key, access_token, timeout=cache_timeout)
            cache.set(
                self.token_expiry_cache_key, token_expires_at, timeout=cache_timeout
            )

            print(f"Successfully got new access token: {access_token[:5]}...")
            print(
                f"Token expires in {expires_in} seconds, cached for {cache_timeout} seconds"
            )

            return access_token

        except requests.exceptions.RequestException as e:
            print(f"Token request exception: {str(e)}")
            raise Exception(f"Failed to get FatSecret access token: {str(e)}")

    def _clear_cached_token(self):
        """Clear cached token data"""
        cache.delete(self.token_cache_key)
        cache.delete(self.token_expiry_cache_key)
        print("Cleared cached token data")

    def search_foods(self, search_expression, page_number=0, max_results=10):
        """Search for foods using FatSecret API v1"""
        access_token = self._get_access_token()

        if not access_token:
            raise Exception("No access token available")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        params = {
            "search_expression": search_expression,
            "page_number": page_number,
            "max_results": max_results,
            "format": "json",
        }

        try:
            response = requests.get(
                self.search_url, headers=headers, params=params, timeout=30
            )

            if response.status_code == 401:
                # Token might be invalid, clear cache and try once more
                print("Received 401, clearing cached token and retrying...")
                self._clear_cached_token()

                # Get new token and retry
                access_token = self._get_access_token()
                headers["Authorization"] = f"Bearer {access_token}"

                response = requests.get(
                    self.search_url, headers=headers, params=params, timeout=30
                )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Search request failed: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"Search API Request exception: {str(e)}")
            raise Exception(f"FatSecret search API error: {str(e)}")

    def get_food_details(self, food_id):
        """Get detailed nutrition information for a specific food using v4 API"""
        access_token = self._get_access_token()

        if not access_token:
            raise Exception("No access token available")

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        params = {"food_id": str(food_id), "format": "json"}

        print(f"Food API request URL: {self.food_url}")
        print(f"Food API request params: {params}")
        # print(f"Food API request headers: {headers}")

        try:
            response = requests.get(
                self.food_url,
                headers=headers,
                params=params,
                timeout=30,
            )

            print(f"Food API Response Status: {response.status_code}")
            # print(f"Food API Response Text: {response.text}")

            if response.status_code == 401:
                # Token might be invalid, clear cache and try once more
                print("Received 401, clearing cached token and retrying...")
                self._clear_cached_token()

                # Get new token and retry
                access_token = self._get_access_token()
                headers["Authorization"] = f"Bearer {access_token}"

                response = requests.get(
                    self.food_url,
                    headers=headers,
                    params=params,
                    timeout=30,
                )

                print(f"Food API Retry Response Status: {response.status_code}")
                print(f"Food API Retry Response Text: {response.text}")

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(
                    f"Food details request failed with status {response.status_code}: {response.text}"
                )

        except requests.exceptions.RequestException as e:
            print(f"Food API Request exception: {str(e)}")
            raise Exception(f"FatSecret food API error: {str(e)}")