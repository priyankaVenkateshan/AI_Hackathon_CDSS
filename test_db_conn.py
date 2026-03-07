import psycopg2
import sys
import boto3

def test_conn():
    try:
        # Generate token
        client = boto3.client("rds", region_name="ap-south-1")
        token = client.generate_db_auth_token(
            DBHostname="cdss-db.c3coggyeulk5.ap-south-1.rds.amazonaws.com",
            Port=5432,
            DBUsername="cdssadmin"
        )
        
        print(f"Token generated (length {len(token)})")

        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            dbname="cdssdb",
            user="cdssadmin",
            password="***REDACTED***"
        )
        print("Connection successful using Password!")
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_conn()
