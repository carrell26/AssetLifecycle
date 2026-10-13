"""
Package init. Re-export create_app dari app.py supaya bisa dipanggil
dengan `from app import create_app` (tanpa perlu tahu ada file app.py
di dalamnya).
"""
from .app import create_app

__all__ = ["create_app"]