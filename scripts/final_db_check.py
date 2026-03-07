import psycopg2
from psycopg2.extras import RealDictCursor

def check():
    conn = psycopg2.connect(host="localhost", database="cdssdb", user="postgres", password="password", port="5433")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT count(*) FROM patients")
    count = cur.fetchone()['count']
    print(f"Total Patients in DB: {count}")
    
    cur.execute("SELECT full_name, patient_id FROM patients ORDER BY created_at DESC LIMIT 5")
    print("\nRecent 5 Patients:")
    for row in cur.fetchall():
        print(f"- {row['full_name']} (ID: {row['patient_id']})")
        
    cur.close()
    conn.close()

if __name__ == "__main__": check()
