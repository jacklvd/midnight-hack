from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TruthLens API"
    api_prefix: str = "/api"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    max_upload_size_bytes: int = 10 * 1024 * 1024
    detector_model_id: str = "dima806/deepfake_vs_real_image_detection"
    detector_device: int = -1

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="TRUTHLENS_",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
