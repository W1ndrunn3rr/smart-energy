from supabase import create_client, Client
from app.database.models import User
class DataBase:
    def __init__(self, url: str, key:str):
        self.db : Client = create_client(url,key)

    def get_user(self,user_id : int) -> User:
        response = (
           self.db.table('Users')
           .select("*")
           .eq('user_id', user_id)
           .limit(1)
           .execute()
        )
        return User(**response.data[0])
