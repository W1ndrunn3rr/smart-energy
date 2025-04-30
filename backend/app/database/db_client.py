import os
from google.cloud.sql.connector import Connector, IPTypes
import pg8000
import os
from dotenv import load_dotenv
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from app.database.models import User, Facility
class DataBase:
    def __init__(self):
        self.connector = Connector()

        self.pool = sqlalchemy.create_engine(
            "postgresql+pg8000://",
            creator=lambda: self.connector.connect(
            os.environ.get("INSTANCE_CONNECTION_NAME"),
            "pg8000",
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD"),
            db=os.environ.get("DB_NAME"),
        ),
        )



    
    def execute_query(self, query: str):
        with self.pool.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
            print("Połączenie udane!")
        