import React from "react";
import NewsCard from "../../../components/NewsCard";
import SkeletonCard from "../../../components/SkeletonCard";

export default function ArticleGrid({
  loading,
  filtered,
  debouncedSearch,
}) {
  if (loading) {
    return (
      <>
        {Array(9)
          .fill(null)
          .map((_, i) => (
            <SkeletonCard key={i} />
          ))}
      </>
    );
  }

  if (debouncedSearch && filtered.length === 0) {
    return <div className="empty">No articles matched your search.</div>;
  }

  return (
    <>
      {filtered.map((a, i) => (
        <NewsCard key={`${a.id}-${i}`} article={a} index={i} />
      ))}
    </>
  );
}