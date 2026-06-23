import { router } from "./_core/trpc";
import { facebookDownloaderRouter } from "./routers/facebookDownloader";

export const appRouter = router({
  facebookDownloader: facebookDownloaderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
