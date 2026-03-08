import os
import sqlalchemy

passwords = ["***REDACTED***", "***REDACTED***", "PASSWORD"]
databases = ["cdssdb", "postgres"]

def grant_iam_role():
    for db in databases:
        for pwd in passwords:
            db_url = f"postgresql+psycopg2://cdssadmin:{pwd}@localhost:5433/{db}"
            print(f"Trying: {db_url}")
            try:
                engine = sqlalchemy.create_engine(db_url, connect_args={"connect_timeout": 3})
                with engine.connect() as conn:
                    print("Connection successful! Executing: GRANT rds_iam TO cdssadmin;")
                    conn.execute(sqlalchemy.text("GRANT rds_iam TO cdssadmin;"))
                    conn.commit()
                    print("Successfully granted rds_iam role to cdssadmin!")
                    return
            except Exception as e:
                pass
    print("Failed to connect with any known password/database combination.")

if __name__ == "__main__":
    grant_iam_role()
