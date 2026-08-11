import os
import logging
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# Configure logger for database operations
logger = logging.getLogger("visionpitch.database")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

_db_pool = None

def get_db_pool(db_url: str = None, minconn: int = 1, maxconn: int = 10):
    global _db_pool
    if _db_pool is None or _db_pool.closed:
        target_url = db_url or os.getenv("DATABASE_URL")
        if not target_url:
            raise ValueError(
                "DATABASE_URL environment variable is missing. "
                "Please set DATABASE_URL to your PostgreSQL connection string."
            )
        logger.info("Initializing PostgreSQL ThreadedConnectionPool (min=%d, max=%d)...", minconn, maxconn)
        _db_pool = psycopg2.pool.ThreadedConnectionPool(minconn, maxconn, target_url)
    return _db_pool

def close_db_pool():
    global _db_pool
    if _db_pool and not _db_pool.closed:
        logger.info("Closing PostgreSQL connection pool...")
        _db_pool.closeall()
        _db_pool = None

def get_db_connection(db_url: str = None):
    """Direct connection fallback for standalone scripts or compatibility."""
    target_url = db_url or os.getenv("DATABASE_URL")
    if not target_url:
        raise ValueError(
            "DATABASE_URL environment variable is missing. "
            "Please set DATABASE_URL to your PostgreSQL connection string."
        )
    return psycopg2.connect(target_url)

@contextmanager
def get_db_cursor(db_url: str = None, cursor_factory=None):
    """
    Context manager providing a database connection and cursor from the connection pool.
    Handles commit on success, rollback on exception, and return of connection to pool.
    """
    pool_instance = get_db_pool(db_url)
    conn = pool_instance.getconn()
    cursor = None
    try:
        if cursor_factory:
            cursor = conn.cursor(cursor_factory=cursor_factory)
        else:
            cursor = conn.cursor()
        yield conn, cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error("Database operation error, performing rollback: %s", e)
        raise e
    finally:
        if cursor:
            cursor.close()
        pool_instance.putconn(conn)

def init_db(db_url: str = None):
    logger.info("Connecting to PostgreSQL to initialize tables...")
    try:
        conn = get_db_connection(db_url)
        with conn.cursor() as cursor:
            logger.info("Creating PostgreSQL tables...")

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
        conn.close()
        logger.info("PostgreSQL database and tables successfully initialized.")
    except Exception as e:
        logger.error("Failed to initialize PostgreSQL database: %s", e)
        raise e

if __name__ == "__main__":
    init_db()
