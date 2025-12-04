from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from jose import jwt, JWTError

PWD_CONTEXT = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")

SECRET_KEY = os.getenv("JWT_SECRET", "change_me_secret")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def hash_password(password: str) -> str:
    # bcrypt max length fix (truncate to 72 bytes)
    password = password[:72]
    return PWD_CONTEXT.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    plain = plain[:72]
    return PWD_CONTEXT.verify(plain, hashed)

def create_access_token(subject: str, expires_delta=None) -> str:
    data = {"sub": subject}
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
