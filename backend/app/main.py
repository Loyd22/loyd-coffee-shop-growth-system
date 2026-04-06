# Import FastAPI so we can create the backend app
from fastapi import FastAPI

# Create the FastAPI application
app = FastAPI(title="Loyd Coffee Shop Growth System API")


# This is a simple test route for the homepage
@app.get("/")
def read_root():
    return {"message": "Backend is running"}


# This is a health check route
# We use this to quickly confirm that the API is working
@app.get("/health")
def health_check():
    return {"status": "ok"}