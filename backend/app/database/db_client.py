import os
import uuid
from typing import List, Optional, Dict, Any, Union
from passlib.hash import bcrypt

from dotenv import load_dotenv
from google.cloud.sql.connector import Connector
import pg8000
import sqlalchemy
from sqlalchemy import text

from app.api_models.models import *


class DataBase:
    """Database client for Smart Energy application."""

    def __init__(self) -> None:
        """Initialize database connection pool using Cloud SQL connector."""
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

    # ==================== Private Helper Methods ====================

    def _execute_query(
        self, query: str, params: Optional[Dict[str, Any]] = None
    ) -> None:
        """Execute a database query with optional parameters.

        Args:
            query: SQL query string
            params: Optional parameters for the query
        """
        try:
            with self.pool.connect() as conn:
                if params:
                    conn.execute(text(query), params)
                else:
                    conn.execute(text(query))
                conn.commit()
        except Exception as e:
            raise DatabaseError(f"Error executing query: {str(e)}")

    def _fetch_query_results(
        self, query: str, params: Optional[Dict[str, Any]] = None
    ) -> List[tuple]:
        """Execute a query and return fetched results.

        Args:
            query: SQL query string
            params: Optional parameters for the query

        Returns:
            List of result tuples
        """
        try:
            with self.pool.connect() as conn:
                if params:
                    result = conn.execute(text(query), params).fetchall()
                else:
                    result = conn.execute(text(query)).fetchall()
                return result
        except Exception as e:
            raise DatabaseError(f"Error fetching query results: {str(e)}")

    def _get_entity_id(self, entity_type: str, field: str, value: str) -> int:
        """Get entity ID from a field value.

        Args:
            entity_type: Type of entity (users, meters, facilities)
            field: Field to search in
            value: Value to search for

        Returns:
            Entity ID

        Raises:
            ValueError: If entity not found
        """
        id_columns = {
            "users": "user_id",
            "meters": "meter_id",
            "facilities": "facility_id",
        }
        query = f"SELECT {id_columns[entity_type]} FROM {entity_type} WHERE {field} = :{field}"

        params = {field: value}

        with self.pool.connect() as conn:
            result = conn.execute(text(query), params).fetchone()
            if result:
                return result[0]
            raise ValueError(
                f"{entity_type[:-1].capitalize()} with {field} {value} not found"
            )

    def _get_meter_id(self, serial_number: str) -> int:
        """Get meter ID from serial number."""
        return self._get_entity_id("meters", "serial_number", serial_number)

    def _get_user_id(self, email: str) -> int:
        """Get user ID from email."""
        return self._get_entity_id("users", "email", email)

    def _get_facility_id(self, name: str) -> int:
        """Get facility ID from name."""
        return self._get_entity_id("facilities", "name", name)

    def _generate_unique_id(self) -> int:
        """Generate a unique ID for database records.

        Returns:
            Unique integer ID
        """
        return uuid.uuid4().int & 0x7FFFFFFF

    # ==================== Reading Methods ====================

    def get_readings(
        self, facility_name: str, meter_type: Optional[str] = None
    ) -> List[APIReading]:
        """Get readings for a facility, optionally filtered by meter type.

        Args:
            facility_name: Name of the facility
            meter_type: Optional meter type filter

        Returns:
            List of APIReading objects
        """
        facility_id = self._get_facility_id(facility_name)

        base_query = """
        SELECT reading_id, value, reading_date, serial_number, email
        FROM readings
        JOIN meters ON readings.meter_id = meters.meter_id
        JOIN users ON readings.user_id = users.user_id
        WHERE meters.facility_id = :facility_id
        """

        params = {"facility_id": facility_id}
        if meter_type:
            query = f"{base_query} AND meters.meter_type = :meter_type"
            params["meter_type"] = meter_type
        else:
            query = base_query

        result = self._fetch_query_results(query, params)

        return [
            APIReading(
                reading_id=row[0],
                value=row[1],
                reading_date=row[2].isoformat() if row[2] else None,
                meter_serial_number=row[3],
                email=row[4],
            )
            for row in result
        ]

    def make_reading(self, reading_data: APIReading) -> None:
        """Record a new meter reading.

        Args:
            reading_data: APIReading object with reading data
        """
        reading_id = self._generate_unique_id()
        meter_id = self._get_meter_id(reading_data.meter_serial_number)
        user_id = self._get_user_id(reading_data.email)

        query = """
        INSERT INTO readings (reading_id, value, reading_date, meter_id, user_id)
        VALUES (:reading_id, :value, :reading_date, :meter_id, :user_id)
        """

        params = {
            "reading_id": reading_id,
            "value": reading_data.value,
            "reading_date": reading_data.reading_date,
            "meter_id": meter_id,
            "user_id": user_id,
        }

        self._execute_query(query, params)

    def delete_reading(self, reading_id: int) -> None:
        """Delete a meter reading.

        Args:
            user_email: Email of the user
            meter_serial_number: Serial number of the meter
        """
        query = """
        DELETE FROM readings
        WHERE reading_id = :reading_id
        """

        params = {"reading_id": reading_id}

        self._execute_query(query, params)

    def update_reading(self, reading_data: APIReading) -> None:
        """Update a meter reading.

        Args:
            reading_data: APIReading object with updated reading data
        """
        query = """
        UPDATE readings
        SET value = :value, reading_date = :reading_date
        WHERE reading_id = :reading_id
        """

        params = {
            "reading_id": reading_data.reading_id,
            "value": reading_data.value,
            "reading_date": reading_data.reading_date,
        }

        self._execute_query(query, params)

    # ==================== Meter Methods ====================

    def get_all_meters(self, facility_name: str) -> List[APIMeter]:
        """Get all meters for a facility.

        Args:
            facility_name: Name of the facility

        Returns:
            List of APIMeter objects
        """
        facility_id = self._get_facility_id(facility_name)
        query = """
        SELECT serial_number, meter_type, ppe, multiply_factor
        FROM meters
        WHERE facility_id = :facility_id
        """

        result = self._fetch_query_results(query, {"facility_id": facility_id})

        return [
            APIMeter(
                facility_name=facility_name,
                serial_number=row[0],
                meter_type=row[1],
                ppe=row[2],
                multiply_factor=row[3],
            )
            for row in result
        ]

    def get_meters_by_type(self, facility_name: str, meter_type: str) -> List[APIMeter]:
        """Get meters of specific type for a facility.

        Args:
            facility_name: Name of the facility
            meter_type: Type of meter to filter by

        Returns:
            List of APIMeter objects
        """
        facility_id = self._get_facility_id(facility_name)
        query = """
        SELECT serial_number, meter_type, ppe, multiply_factor
        FROM meters
        WHERE facility_id = :facility_id AND meter_type = :meter_type
        """

        params = {"facility_id": facility_id, "meter_type": meter_type}
        result = self._fetch_query_results(query, params)

        return [
            APIMeter(
                facility_name=facility_name,
                serial_number=row[0],
                meter_type=row[1],
                ppe=row[2],
                multiply_factor=row[3],
            )
            for row in result
        ]

    def add_meter(self, meter_data: APIMeter) -> None:
        """Add a new meter."""
        if meter_data.meter_type != "Energia elektryczna":
            meter_data.ppe = None

        meter_id = self._generate_unique_id()
        facility_id = self._get_facility_id(meter_data.facility_name)

        query = """
        INSERT INTO meters (meter_id, serial_number, meter_type, facility_id, ppe, multiply_factor)
        VALUES (:meter_id, :serial_number, :meter_type, :facility_id, :ppe, :multiply_factor)
        """

        params = {
            "meter_id": meter_id,
            "serial_number": meter_data.serial_number,
            "meter_type": meter_data.meter_type,
            "facility_id": facility_id,
            "ppe": meter_data.ppe,
            "multiply_factor": meter_data.multiply_factor,
        }

        self._execute_query(query, params)

    def delete_meter(self, serial_number: str) -> None:
        """Delete a meter by serial number.

        Args:
            serial_number: Serial number of meter to delete
        """
        meter_id = self._get_meter_id(serial_number)
        # Consider using ON DELETE SET NULL in database schema instead of comment
        query = "DELETE FROM meters WHERE meter_id = :meter_id"
        self._execute_query(query, {"meter_id": meter_id})

    def update_meter(self, meter_data: APIMeter) -> None:
        """Update meter information.

        Args:
            meter_data: APIMeter object with updated meter data
        """
        query = """
        UPDATE meters
        SET meter_type = :meter_type,
            ppe = :ppe,
            multiply_factor = :multiply_factor
        WHERE serial_number = :serial_number
        """
        params = {
            "serial_number": meter_data.serial_number,
            "meter_type": meter_data.meter_type,
            "ppe": meter_data.ppe,
            "multiply_factor": meter_data.multiply_factor,
        }

        self._execute_query(query, params)

    # ==================== Facility Methods ====================
    def get_all_user_facilities(self, user_email: str) -> List[APIFacility]:
        """Get all facilities assigned to a user.

        Args:
            user_email: Email of the user

        Returns:
            List of facility names
        """
        user_id = self._get_user_id(user_email)
        query = """
        SELECT f.name, f.address, f.email
        FROM facilities f
        JOIN assignments a ON f.facility_id = a.facility_id
        WHERE a.user_id = :user_id
        """

        result = self._fetch_query_results(query, {"user_id": user_id})

        return [
            APIFacility(name=row[0], address=row[1], email=row[2]) for row in result
        ]

    def get_facility(self, name: str) -> APIFacility:
        """Get a facility by name.

        Args:
            name: Name of the facility

        Returns:
            APIFacility object
        """
        query = "SELECT name, address, email FROM facilities WHERE name = :name"
        result = self._fetch_query_results(query, {"name": name})

        if result:
            return APIFacility(
                name=result[0][0], address=result[0][1], email=result[0][2]
            )
        raise ValueError(f"Facility with name {name} not found")

    def get_all_facilities(self) -> List[APIFacility]:
        """Get all facilities.

        Returns:
            List of APIFacility objects
        """
        query = "SELECT name, address, email FROM facilities"
        result = self._fetch_query_results(query)

        return [
            APIFacility(name=row[0], address=row[1], email=row[2]) for row in result
        ]

    def add_facility(self, facility_data: APIFacility) -> None:
        """Add a new facility.

        Args:
            facility_data: APIFacility object with facility data
        """
        facility_id = self._generate_unique_id()

        query = """
        INSERT INTO facilities (facility_id, name, address, email)
        VALUES (:facility_id, :name, :address, :email)
        """

        params = {
            "facility_id": facility_id,
            "name": facility_data.name,
            "address": facility_data.address,
            "email": facility_data.email,
        }
        self._execute_query(query, params)

    def delete_facility(self, facility_name: str) -> None:
        """Delete a facility by name.

        Args:
            facility_name: Name of the facility to delete
        """
        facility_id = self._get_facility_id(facility_name)
        query = "DELETE FROM facilities WHERE facility_id = :facility_id"
        self._execute_query(query, {"facility_id": facility_id})

    def assign_user_to_facility(self, user_email: str, facility_name: str) -> None:
        """Assign a user to a facility.

        Args:
            user_email: Email of the user
            facility_name: Name of the facility
        """
        assignment_id = self._generate_unique_id()
        user_id = self._get_user_id(user_email)
        facility_id = self._get_facility_id(facility_name)

        query = """
        INSERT INTO assignments (assignment_id, user_id, facility_id)
        VALUES (:assignment_id, :user_id, :facility_id)
        """

        params = {
            "assignment_id": assignment_id,
            "user_id": user_id,
            "facility_id": facility_id,
        }

        self._execute_query(query, params)

    def remove_user_from_facility(self, user_email: str, facility_name: str) -> None:
        """Remove a user from a facility.

        Args:
            user_email: Email of the user
            facility_name: Name of the facility
        """
        user_id = self._get_user_id(user_email)
        facility_id = self._get_facility_id(facility_name)

        query = """
        DELETE FROM assignments
        WHERE user_id = :user_id AND facility_id = :facility_id
        """

        params = {"user_id": user_id, "facility_id": facility_id}

        self._execute_query(query, params)

    def update_facility(self, facility_data: APIFacility) -> None:
        """Update facility information.

        Args:
            facility_data: APIFacility object with updated facility data
        """
        query = """
        UPDATE facilities
        SET address = :address, email = :email
        WHERE name = :name
        """

        params = {
            "name": facility_data.name,
            "address": facility_data.address,
            "email": facility_data.email,
        }

        self._execute_query(query, params)

    # ==================== User Methods ====================
    def get_all_users(self) -> List[APIUser]:
        """Get all users.

        Returns:
            List of User objects
        """
        query = "SELECT email, password, access_level FROM users"
        result = self._fetch_query_results(query)

        return [
            APIUser(email=row[0], password=row[1], access_level=row[2])
            for row in result
        ]

    def get_user_by_email(self, email: str) -> APIUser:
        """Get a user by email.

        Args:
            email: Email of the user

        Returns:
            APIUser object

        Raises:
            ValueError: If user not found
        """
        query = "SELECT email, password, access_level FROM users WHERE email = :email"
        result = self._fetch_query_results(query, {"email": email})

        if result:
            return APIUser(
                email=result[0][0], password=result[0][1], access_level=result[0][2]
            )
        raise ValueError(f"User with email {email} not found")

    def add_user(self, user_data: APIUser) -> None:
        """Add a new user.

        Args:
            user_data: APIUser object with user data
        """
        user_id = self._generate_unique_id()

        query = """
        INSERT INTO users (user_id, email, password, access_level)
        VALUES (:user_id, :email, :password, :access_level)
        """

        params = {
            "user_id": user_id,
            "email": user_data.email,
            "password": bcrypt.hash(user_data.password),
            "access_level": user_data.access_level,
        }
        self._execute_query(query, params)

        # If user is admin (access_level=1), assign to all facilities
        if user_data.access_level == 1:
            for facility in self.get_all_facilities():
                self.assign_user_to_facility(user_data.email, facility.name)

    def delete_user(self, email: str) -> None:
        """Delete a user by email.

        Args:
            email: Email of the user to delete
        """
        user_id = self._get_user_id(email)
        query = "DELETE FROM users WHERE user_id = :user_id"
        self._execute_query(query, {"user_id": user_id})

    def update_user(
        self,
        user_email: str,
        hashed_password: Optional[str] = None,
        user_role: Optional[int] = None,
    ) -> None:
        """Update user information.

        Args:
            user_data: APIUser object with updated user data
        """

        if hashed_password is None:
            query = """
            UPDATE users
            SET access_level = :access_level
            WHERE email = :email
            """
            params = {"email": user_email, "access_level": user_role}
        else:
            query = """
            UPDATE users
            SET password = :password
            WHERE email = :email
            """
            params = {
                "email": user_email,
                "password": hashed_password,
                "access_level": user_role,
            }
        self._execute_query(query, params)

    def block_user(self, email: str) -> None:
        """Block a user by email.

        Args:
            email: Email of the user to block
        """
        query = "UPDATE users SET access_level = 0 WHERE email = :email"
        self._execute_query(query, {"email": email})

    def login_user(self, email: str, password: str) -> Optional[APIUser]:
        """Login a user by verifying email and hashed password.

        Args:
            email: Email of the user
            password: Password of the user
        Returns:
            APIUser object if the email exists and the provided password matches the bcrypt hash.
            None if the user is not found or the password is incorrect.
        Notes:
            The password stored in the database is hashed using bcrypt.
        """
        query = "SELECT email, password, access_level FROM users WHERE email = :email"
        result = self._fetch_query_results(query, {"email": email})

        if result:
            stored_email, stored_hashed_password, access_level = result[0]

            if bcrypt.verify(password, stored_hashed_password):
                return APIUser(
                    email=stored_email, password="", access_level=access_level
                )

        return None

    # # One-time migration of legacy users with plain-text passwords.
    # def migrate_passwords(self):
    #     users = self._fetch_query_results("SELECT user_id, password FROM users")
    #     for user_id, plain_password in users:
    #         hashed_password = bcrypt.hash(plain_password)
    #         self._execute_query(
    #             "UPDATE users SET password = :password WHERE user_id = :user_id",
    #             {"password" : hashed_password, "user_id" : user_id}
    #         )


class DatabaseError(Exception):
    """Exception raised for database operation errors."""

    pass
