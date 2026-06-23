(function (ALB) {
  const STORAGE_KEY = "runHistory";
  const MAX_RUNS = 20;

  function createRunId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  async function readRuns() {
    const stored = await browser.storage.local.get(STORAGE_KEY);
    const runs = stored[STORAGE_KEY];
    return Array.isArray(runs) ? runs : [];
  }

  async function writeRuns(runs) {
    await browser.storage.local.set({ [STORAGE_KEY]: runs.slice(0, MAX_RUNS) });
  }

  function normalizeFailure(failure) {
    return {
      title: failure.title || failure.product?.title || "Unknown product",
      url: failure.url || failure.product?.url || "",
      reason: failure.reason || "Unknown error",
    };
  }

  ALB.runHistory = {
    MAX_RUNS,

    async list() {
      return readRuns();
    },

    async count() {
      return (await readRuns()).length;
    },

    async add(run) {
      const entry = {
        id: run.id || createRunId(),
        completedAt: run.completedAt || Date.now(),
        searchUrl: run.searchUrl || "",
        productCount: run.productCount || 0,
        successCount: run.successCount || 0,
        failureCount: run.failureCount || 0,
        cancelled: Boolean(run.cancelled),
        output: run.output || "",
        failures: (run.failures || []).map(normalizeFailure),
        selectionKey: run.selectionKey || null,
      };

      const runs = await readRuns();
      runs.unshift(entry);
      await writeRuns(runs);
      return entry;
    },

    async clear() {
      await browser.storage.local.remove(STORAGE_KEY);
    },

    formatWhen(timestamp) {
      try {
        return new Date(timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      } catch (_error) {
        return "Unknown time";
      }
    },

    formatSummary(run) {
      const parts = [`${run.productCount} product${run.productCount === 1 ? "" : "s"}`];
      if (run.successCount) {
        parts.push(`${run.successCount} ok`);
      }
      if (run.failureCount) {
        parts.push(`${run.failureCount} failed`);
      }
      if (run.cancelled) {
        parts.push("cancelled");
      }
      return parts.join(" · ");
    },
  };
})(window.ALB);