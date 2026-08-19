import hashlib
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Organization, User

router = APIRouter(prefix="/api/auth", tags=["auth"])

class SignUpRequest(BaseModel):
    organization_name: str
    full_name: str
    email: str
    password: str
    role: Optional[str] = "launch_director"

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    status: str
    token: str
    user_id: int
    full_name: str
    email: str
    role: str
    organization_id: int
    organization_name: str

def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@router.post("/signup", response_model=AuthResponse)
def sign_up(req: SignUpRequest, db: Session = Depends(get_db)):
    try:
        # Check existing user
        existing_user = db.query(User).filter(User.email == req.email.strip()).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User with this email already exists.")

        # Create or find organization
        org = db.query(Organization).filter(Organization.name == req.organization_name.strip()).first()
        if not org:
            org = Organization(name=req.organization_name.strip())
            db.add(org)
            db.commit()
            db.refresh(org)

        valid_roles = ["launch_director", "forecast_analyst", "commercial_associate", "management_viewer"]
        assigned_role = req.role if req.role in valid_roles else "launch_director"

        # Create User
        hashed = hash_pass(req.password)
        new_user = User(
            email=req.email.strip(),
            full_name=req.full_name.strip(),
            hashed_password=hashed,
            role=assigned_role,
            organization_id=org.id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = f"token_{new_user.id}_{org.id}_{hashed[:10]}"

        return {
            "status": "success",
            "token": token,
            "user_id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "organization_id": org.id,
            "organization_name": org.name
        }
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/signin", response_model=AuthResponse)
def sign_in(req: SignInRequest, db: Session = Depends(get_db)):
    try:
        hashed = hash_pass(req.password)
        user = db.query(User).filter(User.email == req.email.strip()).first()
        if not user or user.hashed_password != hashed:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        org_name = "Default Organization"
        if user.organization_id:
            org = db.query(Organization).filter(Organization.id == user.organization_id).first()
            if org:
                org_name = org.name

        token = f"token_{user.id}_{user.organization_id or 1}_{hashed[:10]}"

        return {
            "status": "success",
            "token": token,
            "user_id": user.id,
            "full_name": user.full_name or "User",
            "email": user.email,
            "role": user.role or "launch_director",
            "organization_id": user.organization_id or 1,
            "organization_name": org_name
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
