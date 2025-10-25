from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router

# Create FastAPI application
app = FastAPI(title="M1 User Service", description="User management service for PeerPrep")

# Include API routes
app.include_router(api_router)

# Allow your frontend origin
origins = [
    "http://localhost:3000",
    # you can add production frontend URLs here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,      # allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],        # allow all headers
)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to User Service API"}
    




