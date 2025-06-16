import os
from dotenv import load_dotenv
from nicegui import ui

# Import the page definitions from app.main
# This ensures that the @ui.page decorators in app/main.py are executed
# and the routes are registered with NiceGUI before ui.run() is called.
import app.main  # noqa: F401 -> Ensure app.main is imported to register pages

# Load environment variables from .env file (if present)
load_dotenv()

if __name__ in {"__main__", "__mp_main__"}: # Recommended by NiceGUI for multiprocessing compatibility
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0") # Fly.io expects 0.0.0.0

    # title and favicon can be set here or in app.main using ui.run(title=..., favicon=...)
    # uvicorn_logging_level='warning' helps to reduce log noise in production
    # reload=False is important for production deployments like Fly.io
    ui.run(
        host=host,
        port=port,
        title="My NiceGUI App",
        uvicorn_logging_level='info', # Can be 'warning' or 'error' for less verbosity
        reload=False # IMPORTANT: Set to False for production/deployment
    )