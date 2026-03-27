from datetime import datetime
from pydantic import BaseModel


class AlertOut(BaseModel):
    id: int
    coin_symbol: str
    alert_type: str
    message: str
    severity: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
