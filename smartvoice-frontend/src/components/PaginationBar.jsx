import React from "react";

export default function PaginationBar({
  totalItems = 0,
  page = 1,
  pageSize = 5,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 14,
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 14 }}>
        Showing <b>{start}</b>–<b>{end}</b> of <b>{totalItems}</b>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <select
          className="input"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ width: 100 }}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </select>

        <button
          className="btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          Prev
        </button>

        <div style={{ minWidth: 90, textAlign: "center", fontWeight: 700 }}>
          Page {page} / {totalPages}
        </div>

        <button
          className="btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
