import { Skeleton } from "@/components/ui/skeleton";

export default function SiteLoading() {
  return (
    <div className="flex flex-col">
      <div className="bg-ink">
        <div className="container flex min-h-[26rem] items-center justify-center py-20 sm:min-h-[32rem]">
          <Skeleton className="h-10 w-64 rounded-full bg-white/10" />
        </div>
      </div>

      <div className="container flex flex-col gap-8 py-10 sm:py-14">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-full" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>

        <div className="grid grid-cols-2 gap-5 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-3xl border border-border p-3">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
