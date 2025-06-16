from nicegui import ui

# Define the main UI page
@ui.page('/')
def main_page():
    ui.label('Hello, NiceGUI on Fly.io!')
    ui.label('This is a simple application running with NiceGUI.')

# Define a health check page for Fly.io
@ui.page('/health')
def health_check_page():
    # Fly.io health checks typically look for a 200 OK status.
    # This page will return 200 OK. Content can be simple.
    ui.label('{"status": "healthy"}')

# Note: No ui.run() here. 
# This file only defines the UI pages and elements.
# The actual server will be started by project_base/main.py