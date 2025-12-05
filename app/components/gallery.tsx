"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./gallery.module.scss";
import { useGalleryStore } from "../store/gallery";
import { IconButton } from "./button";
import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import dynamic from "next/dynamic";
import CopyIcon from "../icons/copy.svg";
import { showModal } from "./ui-lib";
import { copyToClipboard } from "../utils";
import { Link, useNavigate } from "react-router-dom";
import { Path } from "../constant";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  ssr: false,
});

export default function Gallery() {
  const store = useGalleryStore();
  const items = store.items;
  const parentRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const filtered = items.filter((it) => {
    const hay = `${it.title || ""} ${it.prompt || ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  useEffect(() => {
    const ob = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisibleCount((c) => Math.min(items.length, c + 10));
      }
    });
    if (sentinelRef.current) ob.observe(sentinelRef.current);
    return () => ob.disconnect();
  }, [items.length]);
  return (
    <div className={styles.wrap} ref={parentRef}>
      <div className={styles.toolbar}>
        <IconButton
          text="清空"
          icon={<ResetIcon />}
          onClick={() => store.clear()}
        />
        <IconButton
          text="侧边栏"
          icon={<ResetIcon />}
          onClick={() => navigate(Path.Home)}
        />
        <input
          placeholder="搜索标题或提示词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            minWidth: 160,
            border: "var(--border-in-light)",
            borderRadius: 10,
            padding: "8px 10px",
            background: "var(--white)",
            color: "var(--black)",
          }}
        />
      </div>
      <div className={styles.grid}>
        {filtered.slice(0, visibleCount).map((it) => (
          <div key={it.id} className={styles.card}>
            <Link to={`${Path.Square}/${it.id}`}>
              <video
                className={styles.video}
                src={it.url}
                muted
                playsInline
                preload="metadata"
              />
            </Link>
            <div className={styles.title}>
              {(it.title || (it.prompt || "").split("\n")[0]).slice(0, 60)}
            </div>
          </div>
        ))}
        <div ref={sentinelRef} className={styles.sentinel} />
      </div>
    </div>
  );
}
