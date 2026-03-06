#!/usr/bin/env python3
"""
Local HTTP server that wraps the CDSS Lambda router for frontend-to-backend testing.

Run from repo root:
  PYTHONPATH=src python scripts/run_api_local.py

Then in frontend/apps/doctor-dashboard set .env.local:
  VITE_API_URL=http://localhost:8080
  VITE_USE_MOCK=false

And run: npm run dev. The app will call this server. Without DATABASE_URL,
get_session is mocked so responses use empty data.
"""
from __future__ import annotations

import json
import os
import sys
from contextlib import contextmanager
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from unittest.mock import MagicMock, patch

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

# Optional: mock DB when no DATABASE_URL so server works without Aurora
USE_DB = bool(os.environ.get("DATABASE_URL") or os.environ.get("RDS_CONFIG_SECRET_NAME"))


def _mock_session():
    import datetime
    from unittest.mock import MagicMock

    class MockModel:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    # Sample Patients
    patients = [
        MockModel(id="PT-1001", name="Rajesh Kumar", gender="M", conditions=["Hypertension"], blood_group="B+", severity="moderate", status="active", vitals={"bp": "130/82", "hr": 78}, last_visit=datetime.date(2025, 2, 20)),
        MockModel(id="PT-1002", name="Priya Sharma", gender="F", conditions=["Asthma"], blood_group="O+", severity="low", status="active", vitals={"bp": "118/76", "hr": 72}, last_visit=datetime.date(2025, 3, 1)),
    ]

    # Sample Surgeries
    surgeries = [
        MockModel(id="SRG-001", patient_id="PT-1001", type="Laparoscopic Cholecystectomy", scheduled_date=datetime.date(2025, 3, 15), scheduled_time="09:00", status="scheduled", requirements={"instruments": ["Laparoscope"], "complexity": "Moderate"}),
        MockModel(id="SRG-002", patient_id="PT-1003", type="Cataract Surgery", scheduled_date=datetime.date(2025, 3, 18), scheduled_time="11:00", status="scheduled", requirements={"instruments": ["IOL"], "complexity": "Low"}),
    ]

    session = MagicMock()
    
    # Mocking session.scalars(select(...)).all()
    def mock_scalars(statement):
        stmt_str = str(statement).lower()
        mock_result = MagicMock()
        if "from patients" in stmt_str:
            mock_result.all.return_value = patients
            mock_result.__iter__ = lambda x: iter(patients)
        elif "from surgeries" in stmt_str:
            mock_result.all.return_value = surgeries
            mock_result.__iter__ = lambda x: iter(surgeries)
        else:
            mock_result.all.return_value = []
            mock_result.__iter__ = lambda x: iter([])
        return mock_result

    session.scalars.side_effect = mock_scalars
    session.scalar.return_value = None
    session.execute.return_value.all.return_value = []
    session.execute.return_value.first.return_value = None
    
    return session


@contextmanager
def _mock_get_session():
    mock_sess = _mock_session()

    @contextmanager
    def fake_cm():
        yield mock_sess

    def fake_get_session(secret_name=None):
        return fake_cm()

    with patch("cdss.db.session.get_session", fake_get_session):
        yield


class CDSSHandler(BaseHTTPRequestHandler):
    def _build_event(self, path: str, method: str, body_bytes: bytes | None) -> dict:
        path = path or "/"
        query = ""
        if "?" in path:
            path, query = path.split("?", 1)
        
        if path.startswith("/api/"):
            proxy = path[5:].rstrip("/")  # strip /api/
            path_params = {"proxy": proxy}
        else:
            path_params = None
            
        # Parse query params
        q_params = {}
        if query:
            import urllib.parse
            q_params = {k: v[0] for k, v in urllib.parse.parse_qs(query).items()}

        role = self.headers.get("X-CDSS-Role", "doctor")
        accept_lang = self.headers.get("Accept-Language", "en")

        event = {
            "httpMethod": method,
            "path": path,
            "pathParameters": path_params,
            "headers": {
                "Accept-Language": accept_lang,
                "Content-Type": self.headers.get("Content-Type", "application/json"),
            },
            "requestContext": {
                "path": path, 
                "authorizer": {
                    "claims": {
                        "custom:role": role, 
                        "sub": "local", 
                        "email": "local@test",
                        "name": "Local Test User"
                    }
                }
            },
            "body": body_bytes.decode("utf-8") if body_bytes else None,
            "queryStringParameters": q_params if q_params else None,
        }
        if self.headers.get("Authorization"):
            event["requestContext"]["authorizer"]["claims"]["token"] = self.headers["Authorization"]
        return event

    def _send_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        self._handle_request("GET", None)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        self._handle_request("POST", body)

    def do_PUT(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        self._handle_request("PUT", body)

    def _handle_request(self, method: str, body: bytes | None):
        path = self.path
        event = self._build_event(path, method, body)
        try:

            if USE_DB:
                from cdss.api.handlers.router import handler
                result = handler(event, None)
            else:
                with _mock_get_session():
                    from cdss.api.handlers.router import handler
                    result = handler(event, None)
        except Exception as e:
            result = {"statusCode": 500, "headers": {}, "body": json.dumps({"error": str(e)})}
        status = result.get("statusCode", 500)
        headers = result.get("headers", {})
        body_out = result.get("body", "{}")
        self.send_response(status)
        self._send_cors()
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()
        if body_out:
            self.wfile.write(body_out.encode("utf-8") if isinstance(body_out, str) else body_out)

    def log_message(self, format, *args):
        print(f"[CDSS] {args[0]}")


def main():
    port = int(os.environ.get("PORT", "8080"))
    with HTTPServer(("", port), CDSSHandler) as httpd:
        print(f"CDSS local API at http://localhost:{port} (mock DB: {not USE_DB})")
        print("Set VITE_API_URL=http://localhost:{port} and VITE_USE_MOCK=false in frontend .env.local")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
