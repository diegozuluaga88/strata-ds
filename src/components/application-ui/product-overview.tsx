import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import clsx from 'clsx'
import type { ComponentPropsWithoutRef } from 'react'

export function ProductLayout({ className, children, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(className, 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8')}
        >
            {children}
        </div>
    )
}

export function ProductGallery({ images, className, ...props }: { images: { id: number, name: string, src: string, alt: string }[] } & Omit<ComponentPropsWithoutRef<'div'>, 'onChange'>) {
    return (
        <TabGroup as="div" className={clsx("flex flex-col-reverse", className)} {...props}>
            <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <TabList className="grid grid-cols-4 gap-6">
                    {images.map((image) => (
                        <Tab
                            key={image.id}
                            className="relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4"
                        >
                            {({ selected }) => (
                                <>
                                    <span className="sr-only">{image.name}</span>
                                    <span className="absolute inset-0 overflow-hidden rounded-md">
                                        <img alt="" src={image.src} className="h-full w-full object-cover object-center" />
                                    </span>
                                    <span
                                        className={clsx(
                                            selected ? 'ring-indigo-500' : 'ring-transparent',
                                            'pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2'
                                        )}
                                        aria-hidden="true"
                                    />
                                </>
                            )}
                        </Tab>
                    ))}
                </TabList>
            </div>

            <TabPanels className="aspect-h-1 aspect-w-1 w-full">
                {images.map((image) => (
                    <TabPanel key={image.id}>
                        <img
                            alt={image.alt}
                            src={image.src}
                            className="h-full w-full object-cover object-center sm:rounded-lg"
                        />
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    )
}

export function ProductDetails({ className, children, ...props }: ComponentPropsWithoutRef<'div'>) {
    return (
        <div className={clsx(className, "mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0")} {...props}>
            {children}
        </div>
    )
}

export function ProductTitle({ className, ...props }: ComponentPropsWithoutRef<'h1'>) {
    return (
        <h1 className={clsx(className, "text-3xl font-bold tracking-tight text-zinc-900 dark:text-white")} {...props} />
    )
}

export function ProductPrice({ className, ...props }: ComponentPropsWithoutRef<'p'>) {
    return (
        <p className={clsx(className, "text-3xl tracking-tight text-zinc-900 dark:text-white")} {...props} />
    )
}
