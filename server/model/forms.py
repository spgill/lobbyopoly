# stdlib imports

# vendor imports
import pydantic

# local imports


class TransferForm(pydantic.BaseModel):
    source: str
    destination: str
    amount: int
