from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from models.user import User
from models.auth import AuthCredentials
from models.profile import Profile
from models.business import Business
from models.role import Role
from schemas.auth_schema import *
from core.security import hash_password, verify_password, create_access_token
from core.config import settings
from jose import jwt, JWTError
import re 

from datetime import datetime

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# In register_personal function:
@router.post("/register/personal")
def register_personal(payload: RegisterPersonal, db: Session = Depends(get_db)):
    email_exists = db.query(User).filter(User.email == payload.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already exists")

    role = db.query(Role).filter(Role.role_name == "personal_user").first()

    user = User(email=payload.email, role_id=role.id)
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        display_name=f"{payload.firstname} {payload.lastname}",
        is_business=False
    )
    db.add(profile)

    hashed = hash_password(payload.password)
    
    creds = AuthCredentials(
        user_id=user.id,
        password_hash=hashed,
        failed_attempts=0,
        last_failed_at=None,
        last_login=None
    )
    db.add(creds)

    db.commit()

    return {"message": "Account created successfully"}

# In register_business_admin function:
@router.post("/register/business_admin")
def register_business_admin(payload: RegisterBusinessAdmin, db: Session = Depends(get_db)):
    email_exists = db.query(User).filter(User.email == payload.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already in use")

    role = db.query(Role).filter(Role.role_name == "business_admin").first()

    business = Business(name=payload.businessname)
    db.add(business)
    db.commit()
    db.refresh(business)

    user = User(email=payload.email, role_id=role.id, business_id=business.id)
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        display_name=payload.fullname,
        is_business=True,
        business_name=payload.businessname
    )
    db.add(profile)

    hashed = hash_password(payload.password)
    
    creds = AuthCredentials(
        user_id=user.id,
        password_hash=hashed,
        failed_attempts=0,
        last_failed_at=None,
        last_login=None
    )
    db.add(creds)

    business.created_by = user.id
    db.commit()

    return {
        "message": "Business admin registered successfully",
        "business_id": business.id,
        "admin_email": user.email
    }

# In register_business_sub function:
@router.post("/register/business_subuser")
def register_business_sub(payload: RegisterBusinessSub, db: Session = Depends(get_db)):
    # check if the business admin exists
    admin = db.query(User).filter(User.email == payload.businessemail).first()
    if not admin:
        raise HTTPException(status_code=400, detail="Business admin email not found")
    
    # Check if admin is actually a business admin
    admin_role = db.query(Role).filter(Role.id == admin.role_id).first()
    if admin_role.role_name != "business_admin":
        raise HTTPException(status_code=400, detail="The provided email is not a business admin")
    
    # Check if the new user email already exists
    email_exists = db.query(User).filter(User.email == payload.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="Email already in use")

    role = db.query(Role).filter(Role.role_name == "business_subuser").first()
    
    # Get the business name for the profile
    business = db.query(Business).filter(Business.id == admin.business_id).first()
    
    user = User(email=payload.email, role_id=role.id, business_id=admin.business_id, admin_email=admin.email)
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = Profile(
        user_id=user.id,
        display_name=payload.fullname,
        is_business=True,
        business_name=business.name if business else "Unknown Business"
    )
    db.add(profile)

    hashed = hash_password(payload.password)
    
    creds = AuthCredentials(
        user_id=user.id,
        password_hash=hashed,
        failed_attempts=0,
        last_failed_at=None,
        last_login=None
    )
    db.add(creds)

    db.commit()

    return {
        "message": "Sub-user registered successfully",
        "business_id": admin.business_id,
        "admin_email": admin.email
    }

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    print(f"Login attempt for email: {payload.email}")
    
    user = db.query(User).filter(User.email == payload.email).first()
    
    if not user:
        print(f"User not found: {payload.email}")
        raise HTTPException(status_code=400, detail="Invalid email or password")

    creds = db.query(AuthCredentials).filter(AuthCredentials.user_id == user.id).first()
    
    if not creds:
        print(f"No credentials found for user: {user.id}")
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    print(f"Found user: {user.email}, role_id: {user.role_id}")
    
    # Check if role exists
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if not role:
        print(f"Role not found for role_id: {user.role_id}")
        raise HTTPException(status_code=400, detail="User role configuration error")

    # 1. INVALID PASSWORD: increment failed_attempts
    if not verify_password(payload.password, creds.password_hash):
        print(f"Password verification failed for user: {user.email}")
        creds.failed_attempts += 1
        creds.last_failed_at = datetime.utcnow()
        db.commit()

        raise HTTPException(status_code=400, detail="Invalid email or password")

    # 2. SUCCESSFUL LOGIN: reset failed attempts + update last_login
    creds.failed_attempts = 0
    creds.last_failed_at = None
    creds.last_login = datetime.utcnow()
    db.commit()

    # 3. Create token
    token = create_access_token(user.id, role.role_name)
    
    print(f"Login successful for user: {user.email}, role: {role.role_name}")

    return {
        "access_token": token,
        "user_id": user.id,
        "user_type": role.role_name
    }


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def verify_token(
    Authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Validate JWT from Authorization header (Swagger compatible).
    """

    if not Authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        token = Authorization.replace("Bearer ", "").strip()

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/debug-headers")
def debug_headers(authorization: str = Header(None)):
    return {"authorization_received": authorization}


@router.get("/profile")
def get_profile(user: User = Depends(verify_token), db: Session = Depends(get_db)):
    """Get user profile information"""
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Split display_name into first and last name
    display_name = profile.display_name or ""
    name_parts = display_name.split()
    
    if len(name_parts) >= 2:
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
    elif len(name_parts) == 1:
        first_name = name_parts[0]
        last_name = ""
    else:
        first_name = ""
        last_name = ""
    
    response = {
        "id": user.id,
        "email": user.email,
        "display_name": profile.display_name,
        "first_name": first_name,
        "last_name": last_name,
        "user_type": role.role_name,
        "business_name": profile.business_name if profile.is_business else None,
        "business_id": user.business_id,
        "created_at": user.created_at
    }
    
    return response

@router.put("/profile/personal")
def update_personal_profile(
    payload: UpdateProfileRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update personal user profile"""
    # Check if email is taken by another user
    if payload.email != user.email:
        email_exists = db.query(User).filter(User.email == payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update user email
    user.email = payload.email
    db.commit()
    
    # Update profile display name
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.display_name = payload.display_name
    db.commit()
    
    return {"message": "Profile updated successfully"}

@router.put("/profile/business")
def update_business_profile(
    payload: UpdateBusinessProfileRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update business admin profile"""
    # Check if email is taken by another user
    if payload.email != user.email:
        email_exists = db.query(User).filter(User.email == payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update user email
    user.email = payload.email
    db.commit()
    
    # Update business name if user is business admin
    if user.business_id:
        business = db.query(Business).filter(Business.id == user.business_id).first()
        if business:
            business.name = payload.business_name
            db.commit()
    
    # Update profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.display_name = payload.display_name
    profile.business_name = payload.business_name
    db.commit()
    
    return {"message": "Business profile updated successfully"}

@router.put("/profile/subuser")
def update_subuser_profile(
    payload: UpdateSubUserProfileRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Update business sub-user profile"""
    # Check if email is taken by another user
    if payload.email != user.email:
        email_exists = db.query(User).filter(User.email == payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    # Update user email
    user.email = payload.email
    db.commit()
    
    # Update profile
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.display_name = payload.display_name
    db.commit()
    
    return {"message": "Profile updated successfully"}

@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Get user's credentials
    creds = db.query(AuthCredentials).filter(AuthCredentials.user_id == user.id).first()
    if not creds:
        raise HTTPException(status_code=404, detail="Credentials not found")
    
    # Verify old password
    if not verify_password(payload.old_password, creds.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    # Update to new password
    creds.password_hash = hash_password(payload.new_password)
    creds.password_updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/debug/users")
def debug_users(db: Session = Depends(get_db)):
    """Debug endpoint to check users in database"""
    users = db.query(User).all()
    result = []
    
    for user in users:
        creds = db.query(AuthCredentials).filter(AuthCredentials.user_id == user.id).first()
        role = db.query(Role).filter(Role.id == user.role_id).first()
        
        result.append({
            "id": user.id,
            "email": user.email,
            "role_id": user.role_id,
            "role_name": role.role_name if role else None,
            "has_creds": creds is not None,
            "created_at": user.created_at
        })
    
    return {"users": result}

@router.get("/debug/roles")
def debug_roles(db: Session = Depends(get_db)):
    """Debug endpoint to check roles in database"""
    roles = db.query(Role).all()
    return {"roles": [{"id": r.id, "role_name": r.role_name, "permission_level": r.permission_level} for r in roles]}

@router.post("/logout")
def logout(
    user: User = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Logout user by updating last login time (optional) and clearing token client-side"""
        
    return {
        "message": "Successfully logged out",
        "success": True
    }