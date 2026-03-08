import urllib.request
import urllib.error
import urllib.parse
import json
import os
import subprocess

# 1. Get Cognito token
print("Getting Cognito token...")
result = subprocess.run([
    "python", "scripts/auth/get_token.py",
    "--user-pool-id", "ap-south-1_0eRSiDzbY",
    "--client-id", "15hk1uremldsor79jkc7cr866v",
    "--username", "doc2@cdss.ai",
    "--password", "***REDACTED***"
], capture_output=True, text=True)

if result.returncode != 0:
    print(f"Failed to get token: {result.stderr}")
    exit(1)

token = result.stdout.strip()
print(f"Token length: {len(token)}")

base_url = "https://b1q9qcuqia.execute-api.ap-south-1.amazonaws.com/dev"

def test_endpoint(path):
    url = f"{base_url}{path}"
    print(f"\nTesting GET {url}...")
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {token}")
    try:
        response = urllib.request.urlopen(req)
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')[:200]}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
        print(f"Body: {e.read().decode('utf-8')[:500]}")
    except Exception as e:
        print(f"Error: {e}")

test_endpoint("/api/v1/surgeries")
test_endpoint("/api/v1/patients")
test_endpoint("/dashboard")
