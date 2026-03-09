from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GiftCardType, Merchant, UserGiftCard
from app.schemas import GiftCardSearchResult, UserGiftCardCreate, UserGiftCardRead, UserGiftCardUpdate

router = APIRouter(tags=["gift-cards"])


@router.post("/user-gift-cards", response_model=UserGiftCardRead)
def create_user_gift_card(payload: UserGiftCardCreate, db: Session = Depends(get_db)):
    gift_card_type = db.get(GiftCardType, payload.giftcard_type_id)
    if not gift_card_type:
        raise HTTPException(status_code=404, detail="Gift card type not found")

    record = UserGiftCard(
        giftcard_type_id=payload.giftcard_type_id,
        balance=payload.balance,
        code=payload.code.strip(),
        expiry_date=payload.expiry_date,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return UserGiftCardRead(
        id=record.id,
        giftcard_type_id=record.giftcard_type_id,
        giftcard_type_name=gift_card_type.name,
        balance=record.balance,
        code=record.code,
        expiry_date=record.expiry_date,
    )


@router.get("/user-gift-cards", response_model=list[UserGiftCardRead])
def list_user_gift_cards(db: Session = Depends(get_db)):
    records = (
        db.query(UserGiftCard, GiftCardType)
        .join(GiftCardType, UserGiftCard.giftcard_type_id == GiftCardType.id)
        .order_by(UserGiftCard.expiry_date.asc())
        .all()
    )

    return [
        UserGiftCardRead(
            id=gift_card.id,
            giftcard_type_id=gift_card.giftcard_type_id,
            giftcard_type_name=gift_card_type.name,
            balance=gift_card.balance,
            code=gift_card.code,
            expiry_date=gift_card.expiry_date,
        )
        for gift_card, gift_card_type in records
    ]


@router.patch("/user-gift-cards/{gift_card_id}", response_model=UserGiftCardRead)
def update_user_gift_card(gift_card_id: int, payload: UserGiftCardUpdate, db: Session = Depends(get_db)):
    record = db.get(UserGiftCard, gift_card_id)
    if not record:
        raise HTTPException(status_code=404, detail="User gift card not found")

    if payload.giftcard_type_id is not None:
        gift_card_type = db.get(GiftCardType, payload.giftcard_type_id)
        if not gift_card_type:
            raise HTTPException(status_code=404, detail="Gift card type not found")
        record.giftcard_type_id = payload.giftcard_type_id

    if payload.balance is not None:
        record.balance = payload.balance
    if payload.code is not None:
        record.code = payload.code.strip()
    if payload.expiry_date is not None:
        record.expiry_date = payload.expiry_date

    db.commit()
    db.refresh(record)
    gift_card_type = db.get(GiftCardType, record.giftcard_type_id)

    return UserGiftCardRead(
        id=record.id,
        giftcard_type_id=record.giftcard_type_id,
        giftcard_type_name=gift_card_type.name if gift_card_type else "",
        balance=record.balance,
        code=record.code,
        expiry_date=record.expiry_date,
    )


@router.delete("/user-gift-cards/{gift_card_id}")
def delete_user_gift_card(gift_card_id: int, db: Session = Depends(get_db)):
    record = db.get(UserGiftCard, gift_card_id)
    if not record:
        raise HTTPException(status_code=404, detail="User gift card not found")

    db.delete(record)
    db.commit()
    return {"message": "User gift card deleted"}


@router.get("/search", response_model=list[GiftCardSearchResult])
def search_by_merchant(merchant: str = Query(min_length=1), db: Session = Depends(get_db)):
    rows = (
        db.query(UserGiftCard, GiftCardType)
        .join(GiftCardType, UserGiftCard.giftcard_type_id == GiftCardType.id)
        .join(GiftCardType.merchants)
        .filter(Merchant.name.ilike(f"%{merchant.strip()}%"))
        .order_by(UserGiftCard.balance.desc())
        .all()
    )

    if not rows:
        return []

    unique_results: list[GiftCardSearchResult] = []
    seen_ids: set[int] = set()
    for gift_card, gift_card_type in rows:
        if gift_card.id in seen_ids:
            continue
        seen_ids.add(gift_card.id)
        unique_results.append(
            GiftCardSearchResult(
                giftcard_type_name=gift_card_type.name,
                balance=gift_card.balance,
                code=gift_card.code,
                expiry_date=gift_card.expiry_date,
            )
        )

    return unique_results
