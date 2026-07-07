import os
import sqlite3 

# Resolve database path relative to the script directory
DB_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("PRAGMA foreign_keys = ON;")

    print("Creating tables...")

    # 1. Clients table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clients (
        client_id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL, 
        company_name TEXT NOT NULL, 
        industry TEXT NOT NULL,
        website_url TEXT, 
        social_media_urls TEXT, 
        budget REAL NOT NULL,
        client_status TEXT DEFAULT 'Proposal generated',
        CONSTRAINT url_presence CHECK (website_url IS NOT NULL OR social_media_urls IS NOT NULL),
        CONSTRAINT status_check CHECK (
            client_status IN (
                'Proposal generated',
                'Proposal sent', 
                'Proposal viewed', 
                'Proposal signed', 
                'Proposal declined'
            )
        )
    );
    ''')

    # 2. Proposals table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS proposals (
        proposal_id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        proposal_hash TEXT UNIQUE NOT NULL,
        audit_raw_json TEXT NOT NULL,
        recommended_services TEXT NOT NULL,
        final_price REAL NOT NULL,
        signature_data TEXT,
        FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
    );
    ''')

    conn.commit()
    conn.close()
    print(f"Database and tables have been successfully initialized at: {DB_PATH}")

if __name__ == "__main__":
    init_db()
