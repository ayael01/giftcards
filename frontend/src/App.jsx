import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const initialGiftCardForm = {
  giftcard_type_id: "",
  balance: "",
  code: "",
  expiry_date: "",
};

function toEditForm(card) {
  return {
    giftcard_type_id: String(card.giftcard_type_id),
    balance: String(card.balance),
    code: card.code,
    expiry_date: card.expiry_date,
  };
}

export default function App() {
  const [giftCardTypes, setGiftCardTypes] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [merchantLinks, setMerchantLinks] = useState([]);
  const [userGiftCards, setUserGiftCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");

  const [newTypeName, setNewTypeName] = useState("");
  const [newMerchantName, setNewMerchantName] = useState("");
  const [giftCardForm, setGiftCardForm] = useState(initialGiftCardForm);

  const [editingCardId, setEditingCardId] = useState(null);
  const [editForm, setEditForm] = useState(initialGiftCardForm);

  const [activeView, setActiveView] = useState("wallet");
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedMerchantByType, setSelectedMerchantByType] = useState({});

  const totalBalance = userGiftCards.reduce((sum, card) => sum + Number(card.balance), 0);

  async function loadData() {
    try {
      setError("");
      const [types, merchantsData, links, cards] = await Promise.all([
        api.listGiftCardTypes(),
        api.listMerchants(),
        api.listGiftCardTypeMerchants(),
        api.listUserGiftCards(),
      ]);
      setGiftCardTypes(types);
      setMerchants(merchantsData);
      setMerchantLinks(links);
      setUserGiftCards(cards);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const linksByType = useMemo(() => {
    return giftCardTypes.map((type) => {
      const links = merchantLinks.filter((link) => link.giftcard_type_id === type.id);
      const linkMerchantIds = new Set(links.map((link) => link.merchant_id));
      const availableMerchants = merchants.filter((merchant) => !linkMerchantIds.has(merchant.id));
      return {
        type,
        links,
        availableMerchants,
      };
    });
  }, [giftCardTypes, merchantLinks, merchants]);

  const filteredLinksByType = useMemo(() => {
    const term = linkSearch.trim().toLowerCase();
    if (!term) {
      return linksByType;
    }

    return linksByType.filter(({ type, links }) => {
      const matchesType = type.name.toLowerCase().includes(term);
      const matchesMerchant = links.some((link) => link.merchant_name.toLowerCase().includes(term));
      return matchesType || matchesMerchant;
    });
  }, [linksByType, linkSearch]);

  async function onCreateType(e) {
    e.preventDefault();
    try {
      setError("");
      await api.createGiftCardType({ name: newTypeName });
      setNewTypeName("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onCreateMerchant(e) {
    e.preventDefault();
    try {
      setError("");
      await api.createMerchant({ name: newMerchantName });
      setNewMerchantName("");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAddLinkForType(giftcardTypeId) {
    const merchantId = Number(selectedMerchantByType[giftcardTypeId]);
    if (!merchantId) {
      return;
    }

    try {
      setError("");
      await api.linkMerchantToType(giftcardTypeId, merchantId);
      setSelectedMerchantByType((prev) => ({ ...prev, [giftcardTypeId]: "" }));
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onRemoveLink(giftcardTypeId, merchantId) {
    try {
      setError("");
      await api.unlinkMerchantFromType(giftcardTypeId, merchantId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onAddGiftCard(e) {
    e.preventDefault();
    try {
      setError("");
      await api.createUserGiftCard({
        giftcard_type_id: Number(giftCardForm.giftcard_type_id),
        balance: Number(giftCardForm.balance),
        code: giftCardForm.code,
        expiry_date: giftCardForm.expiry_date,
      });
      setGiftCardForm(initialGiftCardForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onDeleteCard(cardId) {
    try {
      setError("");
      await api.deleteUserGiftCard(cardId);
      if (editingCardId === cardId) {
        setEditingCardId(null);
        setEditForm(initialGiftCardForm);
      }
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function onStartEdit(card) {
    setEditingCardId(card.id);
    setEditForm(toEditForm(card));
  }

  async function onSaveEdit(cardId) {
    try {
      setError("");
      await api.updateUserGiftCard(cardId, {
        giftcard_type_id: Number(editForm.giftcard_type_id),
        balance: Number(editForm.balance),
        code: editForm.code,
        expiry_date: editForm.expiry_date,
      });
      setEditingCardId(null);
      setEditForm(initialGiftCardForm);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onSearch(e) {
    e.preventDefault();
    try {
      setError("");
      const results = await api.searchByMerchant(searchTerm);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero reveal">
        <p className="eyebrow">Gift Card Command Center</p>
        <h1>Can I Pay Here?</h1>
        <p className="subtitle">Store all your cards once and instantly check which cards are valid in any merchant.</p>
        <div className="hero-stats">
          <article>
            <span>{userGiftCards.length}</span>
            <p>cards stored</p>
          </article>
          <article>
            <span>{giftCardTypes.length}</span>
            <p>gift card types</p>
          </article>
          <article>
            <span>{totalBalance.toFixed(2)}</span>
            <p>total balance</p>
          </article>
        </div>
      </section>

      <div className="view-switcher">
        <button
          type="button"
          className={activeView === "wallet" ? "switch-tab active" : "switch-tab"}
          onClick={() => setActiveView("wallet")}
        >
          Wallet & Search
        </button>
        <button
          type="button"
          className={activeView === "links" ? "switch-tab active" : "switch-tab"}
          onClick={() => setActiveView("links")}
        >
          Manage Links
        </button>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {activeView === "wallet" && (
        <>
          <section className="panel search-panel reveal">
            <h2>Search By Merchant</h2>
            <form className="row-form" onSubmit={onSearch}>
              <input
                placeholder="Try: Golf, Fox, Super-Pharm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                required
              />
              <button type="submit">Find Matching Cards</button>
            </form>
            <div className="result-grid">
              {searchResults.length === 0 && <p className="empty-state">No search results yet. Run a merchant search above.</p>}
              {searchResults.map((card) => (
                <article className="result-card" key={`${card.giftcard_type_name}-${card.code}`}>
                  <h3>{card.giftcard_type_name}</h3>
                  <p>Balance: {Number(card.balance).toFixed(2)}</p>
                  <p>Code: {card.code}</p>
                  <p>Expires: {card.expiry_date}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="layout-grid">
            <section className="panel reveal">
              <h2>Add User Gift Card</h2>
              <form onSubmit={onAddGiftCard}>
                <select
                  value={giftCardForm.giftcard_type_id}
                  onChange={(e) => setGiftCardForm((f) => ({ ...f, giftcard_type_id: e.target.value }))}
                  required
                >
                  <option value="">Select gift card type</option>
                  {giftCardTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Balance"
                  value={giftCardForm.balance}
                  onChange={(e) => setGiftCardForm((f) => ({ ...f, balance: e.target.value }))}
                  required
                />
                <input
                  placeholder="Card code"
                  value={giftCardForm.code}
                  onChange={(e) => setGiftCardForm((f) => ({ ...f, code: e.target.value }))}
                  required
                />
                <input
                  type="date"
                  value={giftCardForm.expiry_date}
                  onChange={(e) => setGiftCardForm((f) => ({ ...f, expiry_date: e.target.value }))}
                  required
                />
                <button type="submit">Save Gift Card</button>
              </form>
            </section>

            <section className="panel reveal">
              <h2>Catalog Setup</h2>
              <form onSubmit={onCreateType}>
                <label>Add Gift Card Type</label>
                <input value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="BUYME" required />
                <button type="submit">Create Type</button>
              </form>
              <form onSubmit={onCreateMerchant}>
                <label>Add Merchant</label>
                <input value={newMerchantName} onChange={(e) => setNewMerchantName(e.target.value)} placeholder="Golf" required />
                <button type="submit">Create Merchant</button>
              </form>
            </section>
          </div>

          <section className="panel reveal">
            <h2>My Wallet</h2>
            <div className="wallet-list">
              {userGiftCards.length === 0 && <p className="empty-state">No cards yet. Add your first gift card above.</p>}
              {userGiftCards.map((card) => (
                <article className="wallet-item" key={card.id}>
                  {editingCardId === card.id ? (
                    <div className="wallet-edit">
                      <select
                        value={editForm.giftcard_type_id}
                        onChange={(e) => setEditForm((f) => ({ ...f, giftcard_type_id: e.target.value }))}
                        required
                      >
                        <option value="">Select gift card type</option>
                        {giftCardTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.balance}
                        onChange={(e) => setEditForm((f) => ({ ...f, balance: e.target.value }))}
                        required
                      />
                      <input
                        value={editForm.code}
                        onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                        required
                      />
                      <input
                        type="date"
                        value={editForm.expiry_date}
                        onChange={(e) => setEditForm((f) => ({ ...f, expiry_date: e.target.value }))}
                        required
                      />
                      <div className="wallet-actions">
                        <button type="button" onClick={() => onSaveEdit(card.id)}>
                          Save
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setEditingCardId(null);
                            setEditForm(initialGiftCardForm);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{card.giftcard_type_name}</h3>
                      <p>Balance: {Number(card.balance).toFixed(2)}</p>
                      <p>Code: {card.code}</p>
                      <p>Expires: {card.expiry_date}</p>
                      <div className="wallet-actions">
                        <button type="button" onClick={() => onStartEdit(card)}>
                          Edit
                        </button>
                        <button type="button" className="danger-button" onClick={() => onDeleteCard(card.id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {activeView === "links" && (
        <section className="panel reveal">
          <div className="links-header-row">
            <h2>Merchant Links By Gift Card Type</h2>
            <input
              className="link-search-input"
              placeholder="Filter by type or merchant"
              value={linkSearch}
              onChange={(e) => setLinkSearch(e.target.value)}
            />
          </div>
          <div className="type-link-grid">
            {filteredLinksByType.map(({ type, links, availableMerchants }) => (
              <article className="type-link-card" key={type.id}>
                <div className="type-link-top">
                  <h3>{type.name}</h3>
                  <span>{links.length} linked merchants</span>
                </div>

                <div className="merchant-chip-list">
                  {links.length === 0 && <p className="empty-state">No merchants linked yet.</p>}
                  {links.map((link) => (
                    <div className="merchant-chip" key={`${link.giftcard_type_id}-${link.merchant_id}`}>
                      <span>{link.merchant_name}</span>
                      <button
                        type="button"
                        className="chip-remove"
                        onClick={() => onRemoveLink(link.giftcard_type_id, link.merchant_id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="type-link-controls">
                  <select
                    value={selectedMerchantByType[type.id] || ""}
                    onChange={(e) =>
                      setSelectedMerchantByType((prev) => ({
                        ...prev,
                        [type.id]: e.target.value,
                      }))
                    }
                    disabled={availableMerchants.length === 0}
                  >
                    <option value="">{availableMerchants.length === 0 ? "All merchants already linked" : "Select merchant"}</option>
                    {availableMerchants.map((merchant) => (
                      <option key={merchant.id} value={merchant.id}>
                        {merchant.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onAddLinkForType(type.id)}
                    disabled={!selectedMerchantByType[type.id] || availableMerchants.length === 0}
                  >
                    Add Merchant
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filteredLinksByType.length === 0 && <p className="empty-state">No gift card types matched your filter.</p>}
        </section>
      )}
    </main>
  );
}
