import psycopg2
import sys

def verify_db():
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="cdssdb",
            user="postgres",
            password="password",
            port="5433"
        )
        cur = conn.cursor()
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
        tables = [row[0] for row in cur.fetchall()]
        print(f"Tables in cdssdb: {', '.join(tables)}")
        
        cur.execute("SELECT COUNT(*) FROM patients")
        print(f"Patient count: {cur.fetchone()[0]}")
        
        cur.execute("SELECT COUNT(*) FROM inventory")
        print(f"Inventory count: {cur.fetchone()[0]}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Verification failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_db()
