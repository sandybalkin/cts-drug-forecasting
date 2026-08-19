from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False, default="pbkdf2_sha256")
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=False, default="launch_director") # launch_director, forecast_analyst, commercial_associate, management_viewer
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="users")

class AnalogProduct(Base):
    """
    Stores all 150 historical benchmark analog products in PostgreSQL 17 database.
    """
    __tablename__ = "analog_products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(String(100), unique=True, index=True, nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    active_ingredient = Column(String(100), nullable=True)
    pharmacological_class = Column(String(150), nullable=True)
    mechanism_of_action = Column(Text, nullable=True)
    route_of_administration = Column(String(50), nullable=True)
    target_population = Column(String(50), nullable=True)
    addressable_population = Column(Float, nullable=True)
    competition_level = Column(Float, nullable=True)
    relative_price_index = Column(Float, nullable=True)
    market_access_level = Column(Float, nullable=True)
    clinical_evidence_strength = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserForecastInput(Base):
    """
    Stores user-entered input parameters in PostgreSQL 17.
    """
    __tablename__ = "user_forecast_inputs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Core User Identification Inputs
    product_id = Column(String(50), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    
    # Key Numeric User Inputs
    addressable_population = Column(Float, nullable=False)
    estimated_penetration = Column(Float, nullable=False)
    top_k = Column(Integer, nullable=False, default=3)
    w_analog = Column(Float, nullable=False, default=0.10)
    
    # Full Dictionary of User Input Attributes
    user_inputs_json = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)

class ForecastRecord(Base):
    """
    Stores complete forecast outputs, Bass parameters (p, q, m), 
    analogs used, 52-week trajectory points, 12-month points, and explanations in PostgreSQL 17.
    """
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    product_id = Column(String(50), index=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    therapeutic_area = Column(String(100), index=True, nullable=False)
    indication = Column(String(100), nullable=False)
    addressable_population = Column(Float, nullable=False)
    estimated_penetration = Column(Float, nullable=False)

    # Bass Model Calculated Parameters
    p_hat = Column(Float, nullable=False)
    q_hat = Column(Float, nullable=False)
    m_hat = Column(Float, nullable=False)

    # Summary Prescription Totals
    base_52w_rx = Column(Float, nullable=False)
    bull_52w_rx = Column(Float, nullable=False)
    bear_52w_rx = Column(Float, nullable=False)

    top_k = Column(Integer, nullable=False)
    w_analog = Column(Float, nullable=False)

    # Complete JSON Data Blobs
    input_json = Column(JSON, nullable=False)
    bass_params_json = Column(JSON, nullable=False)
    analogs_used_json = Column(JSON, nullable=False)
    weekly_forecast_json = Column(JSON, nullable=False)
    monthly_forecast_json = Column(JSON, nullable=False)
    explanations_json = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
