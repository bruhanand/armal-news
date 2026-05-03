"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { slug: string; name: string };

type Props = {
  categories: Category[];
  activeSlug: string | null;
};

export function CategoryControls({ categories, activeSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const activeName =
    activeSlug && (categories.find((c) => c.slug === activeSlug)?.name ?? activeSlug);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <button
          type="button"
          aria-label="Open categories"
          onClick={() => setOpen(true)}
          style={{
            opacity: 0.5,
            background: "transparent",
            border: "1px solid #ccc",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          ☰ Categories
        </button>
        {activeSlug && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              border: "1px solid #999",
              borderRadius: "999px",
              fontSize: "14px",
              background: "#f0f0f0",
            }}
          >
            {activeName}
            <button
              type="button"
              aria-label={`Clear ${activeName} filter`}
              onClick={() => navigate("/")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </span>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter by category"
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              width: "100%",
              maxWidth: "480px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              padding: "16px",
              boxShadow: "0 -4px 16px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ margin: "0 0 12px", fontSize: "18px" }}>
              Filter by category
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  style={categoryButtonStyle(activeSlug === null)}
                >
                  All
                </button>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => navigate(`/?category=${c.slug}`)}
                    style={categoryButtonStyle(activeSlug === c.slug)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function categoryButtonStyle(active: boolean): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    padding: "12px 8px",
    background: active ? "#f0f0f0" : "transparent",
    border: "none",
    borderBottom: "1px solid #eee",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: active ? 600 : 400,
  };
}
