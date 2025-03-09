from pydantic import BaseModel, Field

class FactCheckResponse(BaseModel):
    score: int = Field(..., ge=0, le=10, description="A score from 0 (false) to 10 (true) representing the accuracy of the claim.")
    explanation: str = Field(..., description="A short explanation of why the claim is accurate or not, with in-text references like [1], [2].")
    context: str = Field(..., description="Relevant background information about the topic.")
