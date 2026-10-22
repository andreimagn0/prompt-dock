from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime

# create new user
# prevent username from contaiing @
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr
    password: str

# login existing user
class UserLogin(BaseModel):
    identifier: str # This can be either username or email
    password: str

# update user details
class UserUpdate(BaseModel):
    current_password: str
    username: str | None = Field(default=None, min_length=3, max_length=30, pattern=r"^[A-Za-z0-9_]+$")
    email: EmailStr | None = None

# what others see of a user's profile
class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True) # lets this read from a SQLAlchemy object
    id: int
    username: str
    created_at: datetime

# what the user sees of their own profile + UserPublic
class UserResponse(UserPublic):
    email: str
    