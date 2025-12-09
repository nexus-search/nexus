import pytest
from app.persistance.db import init_db, drop_db

@pytest.fixture(scope="session")
async def init_database():
    await drop_db()  # Ensure a clean state before tests
    await init_db()
