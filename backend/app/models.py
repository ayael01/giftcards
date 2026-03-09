from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class GiftCardTypeMerchant(Base):
    __tablename__ = "giftcard_type_merchants"
    __table_args__ = (
        UniqueConstraint("giftcard_type_id", "merchant_id", name="uq_giftcard_type_merchant"),
    )

    giftcard_type_id: Mapped[int] = mapped_column(ForeignKey("gift_card_types.id"), primary_key=True)
    merchant_id: Mapped[int] = mapped_column(ForeignKey("merchants.id"), primary_key=True)


class GiftCardType(Base):
    __tablename__ = "gift_card_types"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    merchants: Mapped[list["Merchant"]] = relationship(
        secondary="giftcard_type_merchants", back_populates="gift_card_types"
    )
    user_gift_cards: Mapped[list["UserGiftCard"]] = relationship(back_populates="gift_card_type")


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    gift_card_types: Mapped[list[GiftCardType]] = relationship(
        secondary="giftcard_type_merchants", back_populates="merchants"
    )


class UserGiftCard(Base):
    __tablename__ = "user_gift_cards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    giftcard_type_id: Mapped[int] = mapped_column(ForeignKey("gift_card_types.id"), nullable=False)
    balance: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    code: Mapped[str] = mapped_column(String(128), nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)

    gift_card_type: Mapped[GiftCardType] = relationship(back_populates="user_gift_cards")
