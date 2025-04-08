from setuptools import setup, find_packages

setup(
    name="object-storage-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.115.12",
        "uvicorn==0.33.0",
        "python-multipart==0.0.20",
        "python-jose[cryptography]==3.4.0",
        "passlib[bcrypt]==1.7.4",
        "motor==3.6.1",
        "pydantic==2.10.6",
        "pydantic-settings==2.2.1",
        "python-dotenv==1.0.1",
        "google-auth==2.38.0",
        "google-auth-oauthlib==1.2.1",
        "email-validator==2.1.1",
        "dnspython==2.6.1"
    ],
) 