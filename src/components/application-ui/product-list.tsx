import { Badge } from './badge'
import clsx from 'clsx'
import { Star } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

export function ProductGrid({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(
                className,
                'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8'
            )}
        />
    )
}

export function ProductCard({
    product,
    className,
    ...props
}: {
    product: {
        id: number
        name: string
        href: string
        price: string
        imageSrc: string
        imageAlt: string
        category?: string
        rating?: number
        reviewCount?: number
        inStock?: boolean
    }
} & ComponentPropsWithoutRef<'div'>) {
    return (
        <div className={clsx(className, 'group relative')} {...props}>
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800 xl:aspect-h-8 xl:aspect-w-7">
                <img
                    src={product.imageSrc}
                    alt={product.imageAlt}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                />
                {product.inStock === false && (
                    <div className="absolute top-2 right-2">
                        <Badge color="zinc">Out of Stock</Badge>
                    </div>
                )}
            </div>
            <h3 className="mt-4 text-sm text-zinc-700 dark:text-zinc-200">
                <a href={product.href}>
                    <span className="absolute inset-0" />
                    {product.name}
                </a>
            </h3>
            <div className="mt-1 flex items-center justify-between">
                <p className="text-lg font-medium text-zinc-900 dark:text-white">{product.price}</p>
                {product.rating && (
                    <div className="flex items-center">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="ml-1 text-sm text-zinc-500">{product.rating}</span>
                    </div>
                )}
            </div>
            {product.category && <p className="mt-1 text-sm text-zinc-500">{product.category}</p>}
        </div>
    )
}
