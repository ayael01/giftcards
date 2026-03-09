from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GiftCardType, Merchant
from app.schemas import (
    GiftCardTypeMerchantLinkRead,
    GiftCardTypeCreate,
    GiftCardTypeRead,
    LinkMerchantToTypeResponse,
    MerchantCreate,
    MerchantRead,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/gift-card-types", response_model=GiftCardTypeRead)
def create_gift_card_type(payload: GiftCardTypeCreate, db: Session = Depends(get_db)):
    record = GiftCardType(name=payload.name.strip())
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Gift card type already exists")
    db.refresh(record)
    return record


@router.get("/gift-card-types", response_model=list[GiftCardTypeRead])
def list_gift_card_types(db: Session = Depends(get_db)):
    return db.query(GiftCardType).order_by(GiftCardType.name.asc()).all()


@router.post("/merchants", response_model=MerchantRead)
def create_merchant(payload: MerchantCreate, db: Session = Depends(get_db)):
    record = Merchant(name=payload.name.strip())
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Merchant already exists")
    db.refresh(record)
    return record


@router.get("/merchants", response_model=list[MerchantRead])
def list_merchants(db: Session = Depends(get_db)):
    return db.query(Merchant).order_by(Merchant.name.asc()).all()


@router.post(
    "/gift-card-types/{giftcard_type_id}/merchants/{merchant_id}",
    response_model=LinkMerchantToTypeResponse,
)
def link_merchant_to_type(giftcard_type_id: int, merchant_id: int, db: Session = Depends(get_db)):
    gift_card_type = db.get(GiftCardType, giftcard_type_id)
    merchant = db.get(Merchant, merchant_id)

    if not gift_card_type or not merchant:
        raise HTTPException(status_code=404, detail="Gift card type or merchant not found")

    if merchant in gift_card_type.merchants:
        return LinkMerchantToTypeResponse(message="Relationship already exists")

    gift_card_type.merchants.append(merchant)
    db.commit()
    return LinkMerchantToTypeResponse(message="Merchant linked to gift card type")


@router.get("/gift-card-type-merchants", response_model=list[GiftCardTypeMerchantLinkRead])
def list_gift_card_type_merchants(db: Session = Depends(get_db)):
    links = (
        db.query(GiftCardType, Merchant)
        .join(GiftCardType.merchants)
        .order_by(GiftCardType.name.asc(), Merchant.name.asc())
        .all()
    )
    return [
        GiftCardTypeMerchantLinkRead(
            giftcard_type_id=gift_card_type.id,
            giftcard_type_name=gift_card_type.name,
            merchant_id=merchant.id,
            merchant_name=merchant.name,
        )
        for gift_card_type, merchant in links
    ]


@router.delete(
    "/gift-card-types/{giftcard_type_id}/merchants/{merchant_id}",
    response_model=LinkMerchantToTypeResponse,
)
def unlink_merchant_from_type(giftcard_type_id: int, merchant_id: int, db: Session = Depends(get_db)):
    gift_card_type = db.get(GiftCardType, giftcard_type_id)
    merchant = db.get(Merchant, merchant_id)

    if not gift_card_type or not merchant:
        raise HTTPException(status_code=404, detail="Gift card type or merchant not found")

    if merchant not in gift_card_type.merchants:
        raise HTTPException(status_code=404, detail="Relationship not found")

    gift_card_type.merchants.remove(merchant)
    db.commit()
    return LinkMerchantToTypeResponse(message="Merchant unlinked from gift card type")
