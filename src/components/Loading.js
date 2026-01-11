import React from "react";

export default function Loading({ message = "Loading..." }) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={message}
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #fafafa 0%, #fff 100%)",
                padding: "24px",
                boxSizing: "border-box",
                flexDirection: "column",
                gap: 12,
            }}
        >
            <svg
                width="72"
                height="72"
                viewBox="0 0 64 64"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ display: "block" }}
            >
                <circle
                    cx="32"
                    cy="32"
                    r="20"
                    stroke="#e6e6e6"
                    strokeWidth="6"
                    fill="none"
                />
                <circle
                    cx="32"
                    cy="32"
                    r="20"
                    stroke="#2563eb"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="31.4 125.6"
                >
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 32 32"
                        to="360 32 32"
                        dur="0.9s"
                        repeatCount="indefinite"
                    />
                </circle>
            </svg>

            <div
                style={{
                    fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
                    color: "#111827",
                    fontSize: 16,
                    fontWeight: 500,
                    textAlign: "center",
                }}
            >
                {message}
            </div>
        </div>
    );
}