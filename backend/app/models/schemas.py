from pydantic import BaseModel


class ServiceStatus(BaseModel):
    status: str


class HealthStatus(BaseModel):
    status: str
    elasticsearch: ServiceStatus
    mongodb: ServiceStatus
    model: ServiceStatus
