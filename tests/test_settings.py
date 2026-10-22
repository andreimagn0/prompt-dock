from app.core.settings import Settings


def test_settings_use_development_defaults(monkeypatch) -> None:
    for variable in (
        "APP_NAME",
        "ENVIRONMENT",
        "DATABASE_URL",
        "SECRET_KEY",
        "ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
    ):
        monkeypatch.delenv(variable, raising=False)

    settings = Settings(_env_file=None)

    assert settings.app_name == "Prompt-Dock API"
    assert settings.environment == "development"
    assert settings.database_url == "sqlite:///./prompt_dock.db"
    assert settings.algorithm == "HS256"
    assert settings.access_token_expire_minutes == 30
    assert len(settings.secret_key.encode()) >= 32


def test_environment_variables_override_defaults(monkeypatch) -> None:
    monkeypatch.setenv("APP_NAME", "Prompt-Dock Test API")
    monkeypatch.setenv("ENVIRONMENT", "testing")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./test.db")
    monkeypatch.setenv("SECRET_KEY", "test-secret")
    monkeypatch.setenv("ALGORITHM", "HS512")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "45")

    settings = Settings(_env_file=None)

    assert settings.app_name == "Prompt-Dock Test API"
    assert settings.environment == "testing"
    assert settings.database_url == "sqlite:///./test.db"
    assert settings.secret_key == "test-secret"
    assert settings.algorithm == "HS512"
    assert settings.access_token_expire_minutes == 45
