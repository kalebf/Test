from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterPersonal(BaseModel):
    firstname: str
    lastname: str
    email: str
    password: str

class RegisterBusinessAdmin(BaseModel):
    fullname: str
    businessname: str
    email: str
    password: str

class RegisterBusinessSub(BaseModel):
    fullname: str
    businessemail: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    display_name: str
    email: str

class UpdateBusinessProfileRequest(BaseModel):
    business_name: str
    display_name: str
    email: str

class UpdateSubUserProfileRequest(BaseModel):
    display_name: str
    email: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str