'use client'

export default function StaffPagination({ page, hasMore, loading, onChange }: {
  page: number
  hasMore: boolean
  loading: boolean
  onChange: (page: number) => void
}) {
  if (page === 1 && !hasMore) return null

  return <nav className="staff-pagination" aria-label="Results pagination">
    <div>
      <button type="button" className="button button-outline" disabled={loading || page === 1} onClick={() => onChange(page - 1)}>Previous</button>
      <button type="button" className="button button-outline" disabled={loading || !hasMore} onClick={() => onChange(page + 1)}>Next</button>
    </div>
  </nav>
}
