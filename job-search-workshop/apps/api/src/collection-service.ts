import type { CollectionRun } from "./models.js";
import { JobFinderRepository } from "./database.js";
import { collectListings } from "./source-adapters.js";

export class CollectionAlreadyRunningError extends Error {}

export class CollectionService {
  private activeRunId: string | null = null;

  public constructor(private readonly repository: JobFinderRepository) {}

  public start(): CollectionRun {
    if (this.activeRunId) {
      throw new CollectionAlreadyRunningError(
        "A collection run is already active.",
      );
    }

    const sources = this.repository.listSources().filter((source) => source.enabled);
    const run = this.repository.createCollectionRun(sources.length);
    this.activeRunId = run.id;

    setImmediate(async () => {
      try {
        let successCount = 0;
        let failureCount = 0;
        for (const source of sources) {
          try {
            this.repository.saveListings(source, await collectListings(source));
            this.repository.addSourceResult(run.id, source.id, "success", null);
            successCount += 1;
          } catch {
            this.repository.addSourceResult(run.id, source.id, "failed", "Unable to collect listings from this source.");
            failureCount += 1;
          }
        }

        this.repository.completeCollectionRun(run.id, failureCount ? "partial" : "completed", {
          successCount,
          skippedCount: 0,
          failureCount,
        });
      } catch {
        this.repository.completeCollectionRun(run.id, "failed", {
          successCount: 0,
          skippedCount: 0,
          failureCount: sources.length,
        });
      } finally {
        this.activeRunId = null;
      }
    });

    return run;
  }
}
