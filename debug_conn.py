import psycopg2
import sys

def test_conn(dbname):
    print(f"Testing connection to {dbname}...")
    try:
        conn = psycopg2.connect(
            host="127.0.0.1",
            port=5433,
            dbname=dbname,
            user="cdssadmin",
            password="***REDACTED***",
            connect_timeout=5
        )
        print(f"Connection to {dbname} successful!")
        conn.close()
        return True
    except Exception as e:
        print(f"Connection to {dbname} failed: {e}")
        return False

if __name__ == "__main__":
    s1 = test_conn("postgres")
    s2 = test_conn("cdssdb")
    if not (s1 or s2):
        sys.exit(1)
