import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# Connects to PostgreSQL database using DATABASE_URL env variable
def get_db_connection(db_url: str = None):
    target_url = db_url or os.getenv("DATABASE_URL")
    if not target_url:
        raise ValueError(
            "DATABASE_URL environment variable is missing. "
            "Please set DATABASE_URL to your PostgreSQL connection string (e.g. from Neon.tech)."
        )
    return psycopg2.connect(target_url)

# Initializes clients and proposals tables with constraints & cascade deletion
def init_db(db_url: str = None):
    print("Connecting to PostgreSQL to initialize tables...")
    try:
        conn = get_db_connection(db_url)
        cursor = conn.cursor()

        print("Creating PostgreSQL tables...")

        # Create clients table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS clients (
            client_id SERIAL PRIMARY KEY,
            client_name TEXT NOT NULL, 
            company_name TEXT NOT NULL, 
            industry TEXT NOT NULL,
            website_url TEXT, 
            social_media_urls TEXT, 
            budget REAL,
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

        # Create proposals table linked to clients with cascade delete
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS proposals (
            proposal_id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
            proposal_hash VARCHAR(50) UNIQUE NOT NULL,
            audit_raw_json TEXT NOT NULL,
            recommended_services TEXT NOT NULL,
            final_price REAL NOT NULL,
            signature_data TEXT,
            selected_multipliers TEXT
        );
        ''')

        # Safely migrate existing tables to add selected_multipliers column
        cursor.execute('''
        ALTER TABLE proposals ADD COLUMN IF NOT EXISTS selected_multipliers TEXT;
        ''')

        conn.commit()
        cursor.close()
        conn.close()
        print("PostgreSQL database and tables have been successfully initialized.")
    except Exception as e:
        print(f"Failed to initialize PostgreSQL database: {e}")
        raise e

if __name__ == "__main__":
    init_db()

