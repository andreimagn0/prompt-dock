"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import axios from "axios"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import { getErrorMessage } from "@/api/api"
import { getCategories, type Category } from "@/api/categories"
import { getSkills, type SkillList, type SkillSort } from "@/api/skills"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { LoadingState } from "@/components/common/LoadingState"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SkillGrid } from "./SkillGrid"

const PAGE_SIZE = 10
const ALL_CATEGORIES = "all"

const SORT_OPTIONS: { value: SkillSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title" },
]

type Query = {
  search: string
  categoryId: number | undefined
  sort: SkillSort
  page: number
}

const INITIAL_QUERY: Query = {
  search: "",
  categoryId: undefined,
  sort: "newest",
  page: 1,
}

function isSkillSort(value: string | null): value is SkillSort {
  return SORT_OPTIONS.some((option) => option.value === value)
}

export function SkillDiscovery() {
  // Every query change is a new object, so the fetch effect re-runs even when
  // the values are unchanged (e.g. retrying, or re-submitting the same search).
  const [query, setQuery] = useState<Query>(INITIAL_QUERY)
  const [searchInput, setSearchInput] = useState("")

  const [result, setResult] = useState<SkillList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesError, setCategoriesError] = useState("")
  const [categoriesAttempt, setCategoriesAttempt] = useState(0)

  function updateQuery(changes: Partial<Query>) {
    setLoading(true)
    setError("")
    setQuery((current) => ({ ...current, ...changes }))
  }

  useEffect(() => {
    const controller = new AbortController()

    getSkills(
      {
        search: query.search,
        category_id: query.categoryId,
        sort: query.sort,
        page: query.page,
        limit: PAGE_SIZE,
      },
      { signal: controller.signal }
    )
      .then((data) => {
        setResult(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        // A newer request replaced this one; let that request update the UI
        if (axios.isCancel(err)) return
        setError(getErrorMessage(err))
        setLoading(false)
      })

    return () => controller.abort()
  }, [query])

  useEffect(() => {
    const controller = new AbortController()

    getCategories({ signal: controller.signal })
      .then((data) => {
        setCategories(data)
        setCategoriesError("")
      })
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return
        setCategoriesError(getErrorMessage(err))
      })

    return () => controller.abort()
  }, [categoriesAttempt])

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.limit))
    : 1
  const canGoBack = query.page > 1
  const canGoForward = query.page < totalPages

  const categoryItems = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "All categories" },
      ...categories.map((c) => ({ value: String(c.id), label: c.name })),
    ],
    [categories]
  )

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateQuery({ search: searchInput.trim(), page: 1 })
  }

  function handleClearSearch() {
    setSearchInput("")
    if (query.search) updateQuery({ search: "", page: 1 })
  }

  function handleCategoryChange(value: string | null) {
    const categoryId =
      value === null || value === ALL_CATEGORIES ? undefined : Number(value)
    updateQuery({ categoryId, page: 1 })
  }

  function handleSortChange(value: string | null) {
    if (!isSkillSort(value)) return
    updateQuery({ sort: value, page: 1 })
  }

  function goToPage(page: number) {
    const target = Math.min(Math.max(page, 1), totalPages)
    if (target !== query.page) updateQuery({ page: target })
  }

  const skills = result?.data ?? []
  const hasFilters = Boolean(query.search || query.categoryId !== undefined)

  return (
    <section className="space-y-6" aria-labelledby="discover-heading">
      <h1 id="discover-heading" className="text-2xl font-semibold">
        Discover Skills
      </h1>

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <form
          role="search"
          onSubmit={handleSearch}
          className="flex flex-1 flex-col gap-2"
        >
          <Label htmlFor="skill-search">Search skills</Label>
          <div className="flex gap-2">
            <Input
              id="skill-search"
              type="search"
              placeholder="Add Skills..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <Button type="submit" disabled={loading}>
              <SearchIcon aria-hidden="true" />
              Search
            </Button>
            {(searchInput || query.search) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSearch}
              >
                <XIcon aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-2">
          <Label htmlFor="skill-category">Category</Label>
          <Select
            items={categoryItems}
            value={
              query.categoryId === undefined
                ? ALL_CATEGORIES
                : String(query.categoryId)
            }
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger id="skill-category" className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="skill-sort">Sort by</Label>
          <Select
            items={SORT_OPTIONS}
            value={query.sort}
            onValueChange={handleSortChange}
          >
            <SelectTrigger id="skill-sort" className="w-full md:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {categoriesError && (
        <ErrorState
          message="Categories couldn't be loaded, so category filtering is unavailable. Skills are still listed below."
          onRetry={() => setCategoriesAttempt((n) => n + 1)}
        />
      )}

      <div aria-live="polite" aria-busy={loading}>
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} onRetry={() => updateQuery({})} />
        )}

        {!loading && !error && skills.length === 0 && (
          <EmptyState
            message={
              hasFilters
                ? "No skills match your search or filters."
                : "No public skills are available yet."
            }
          />
        )}

        {!loading && !error && skills.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {result?.total} {result?.total === 1 ? "skill" : "skills"} found
            </p>
            <SkillGrid skills={skills} categories={categories} />
          </div>
        )}
      </div>

      {!error && result && result.total > 0 && (
        <Pagination>
          <PaginationContent className="gap-3">
            <PaginationItem>
              <Button
                variant="outline"
                onClick={() => goToPage(query.page - 1)}
                disabled={loading || !canGoBack}
              >
                <ChevronLeftIcon aria-hidden="true" />
                Previous
              </Button>
            </PaginationItem>
            <PaginationItem className="text-sm text-muted-foreground">
              Page {query.page} of {totalPages}
            </PaginationItem>
            <PaginationItem>
              <Button
                variant="outline"
                onClick={() => goToPage(query.page + 1)}
                disabled={loading || !canGoForward}
              >
                Next
                <ChevronRightIcon aria-hidden="true" />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </section>
  )
}
