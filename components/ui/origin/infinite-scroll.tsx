'use client'

import { useEffect, useRef } from 'react'
import { ReloadIcon } from '@radix-ui/react-icons'

interface InfiniteScrollProps {
    hasMore: boolean
    isLoading: boolean
    next: () => void
    children: React.ReactNode
    className?: string
}

export default function InfiniteScroll({
    hasMore,
    isLoading,
    next,
    children,
    className,
}: InfiniteScrollProps) {
    const observerTarget = useRef<HTMLDivElement>(null)
    // Keep the latest `next` in a ref so the observer never depends on the
    // caller's closure identity (callers commonly pass a fresh closure every
    // render, which previously tore down and recreated the observer each render).
    const nextRef = useRef(next)
    // Re-entrancy guard: once an intersection triggers a load we must not fire
    // `next()` again until new data has actually arrived (i.e. loading settles).
    const loadingRef = useRef(isLoading)
    const requestedRef = useRef(false)

    // Keep the ref pointing at the latest callback without re-creating the
    // observer (writing to a ref must happen in an effect, not during render).
    useEffect(() => {
        nextRef.current = next
    }, [next])

    // Reset the in-flight guard whenever a load completes, so the next
    // intersection is allowed to request another page.
    useEffect(() => {
        if (!isLoading) {
            requestedRef.current = false
        }
        loadingRef.current = isLoading
    }, [isLoading])

    // Create the observer once. It only depends on `hasMore` so the sentinel is
    // re-observed when there is more data to load, but it is immune to changes
    // in `next`'s identity or to `isLoading` flapping (e.g. SWR keepPreviousData).
    useEffect(() => {
        const target = observerTarget.current
        if (!target) {
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    hasMore &&
                    !loadingRef.current &&
                    !requestedRef.current
                ) {
                    requestedRef.current = true
                    nextRef.current()
                }
            },
            { threshold: 0, rootMargin: '200px 0px' }
        )

        observer.observe(target)

        return () => observer.disconnect()
    }, [hasMore])

    return (
        <div className={className}>
            {children}
            <div ref={observerTarget} className='h-4 w-full flex items-center justify-center mt-4'>
                {isLoading && <ReloadIcon className='h-4 w-4 animate-spin' />}
            </div>
        </div>
    )
}
