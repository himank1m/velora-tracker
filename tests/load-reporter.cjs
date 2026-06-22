const fs = require('node:fs');
const path = require('node:path');

class VeloraLoadReporter {
  constructor() {
    this.startedAt = new Date();
    this.results = [];
  }

  onTestEnd(test, result) {
    const metricsAttachment = result.attachments.find((attachment) => attachment.name === 'load-metrics');
    let metrics = null;

    if (metricsAttachment?.body) {
      try {
        metrics = JSON.parse(metricsAttachment.body.toString('utf8'));
      } catch {
        metrics = null;
      }
    }

    this.results.push({
      test: test.title,
      status: result.status,
      durationMs: result.duration,
      retry: result.retry,
      errors: result.errors.map((error) => error.message || String(error)),
      metrics,
    });
  }

  onEnd(runResult) {
    const outputDirectory = path.resolve('test-results');
    fs.mkdirSync(outputDirectory, { recursive: true });

    const failed = this.results.filter((result) => !['passed', 'skipped'].includes(result.status));
    const pageTimings = this.results.flatMap((result) => {
      const timings = result.metrics?.timings || {};
      return Object.entries(timings).map(([page, durationMs]) => ({
        test: result.test,
        page,
        durationMs,
      }));
    });
    const timingValues = pageTimings.map((timing) => timing.durationMs).filter(Number.isFinite);
    const averagePageLoadMs = timingValues.length
      ? Math.round(timingValues.reduce((sum, value) => sum + value, 0) / timingValues.length)
      : null;

    const summary = {
      startedAt: this.startedAt.toISOString(),
      completedAt: new Date().toISOString(),
      status: runResult.status,
      total: this.results.length,
      passed: this.results.filter((result) => result.status === 'passed').length,
      failed: failed.length,
      skipped: this.results.filter((result) => result.status === 'skipped').length,
      averagePageLoadMs,
      pageTimings,
      tests: this.results,
    };

    fs.writeFileSync(
      path.join(outputDirectory, 'load-summary.json'),
      `${JSON.stringify(summary, null, 2)}\n`,
    );

    console.log('');
    console.log('Velora load summary');
    console.log(`Total: ${summary.total} | Passed: ${summary.passed} | Failed: ${summary.failed} | Skipped: ${summary.skipped}`);
    console.log(`Average measured page load: ${summary.averagePageLoadMs ?? 'n/a'} ms`);
    console.log(`Report: ${path.join(outputDirectory, 'load-summary.json')}`);
  }
}

module.exports = VeloraLoadReporter;
