from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Server
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # File limits
    max_file_size_mb: int = 10
    max_screenshots: int = 10

    # API version
    api_version: str = "v1"
    api_prefix: str = "/api/v1"

    # Phase 2 — AI keys (optional for now)
    google_vision_api_key: str = ""
    huggingface_api_token: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
