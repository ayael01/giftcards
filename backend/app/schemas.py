from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GiftCardTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class GiftCardTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class MerchantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class MerchantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class LinkMerchantToTypeResponse(BaseModel):
    message: str


class GiftCardTypeMerchantLinkRead(BaseModel):
    giftcard_type_id: int
    giftcard_type_name: str
    merchant_id: int
    merchant_name: str


class UserGiftCardCreate(BaseModel):
    giftcard_type_id: int
    balance: Decimal = Field(gt=0)
    code: str = Field(min_length=1, max_length=128)
    expiry_date: date


class UserGiftCardUpdate(BaseModel):
    giftcard_type_id: Optional[int] = None
    balance: Optional[Decimal] = Field(default=None, gt=0)
    code: Optional[str] = Field(default=None, min_length=1, max_length=128)
    expiry_date: Optional[date] = None


class UserGiftCardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    giftcard_type_id: int
    giftcard_type_name: str
    balance: Decimal
    code: str
    expiry_date: date


class GiftCardSearchResult(BaseModel):
    giftcard_type_name: str
    balance: Decimal
    code: str
    expiry_date: date
