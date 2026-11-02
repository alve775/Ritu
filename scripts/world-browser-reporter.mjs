import fs from 'node:fs';
const path = 'research/global-audit-2026-11-01/browser-world-results.jsonl';
class Reporter {
  onBegin(_config, suite) {
    this.total = suite.allTests().length;
    this.completed = 0;
    this.failed = 0;
    fs.writeFileSync(
      path,
      JSON.stringify({ type: 'begin', at: new Date().toISOString(), total: this.total }) + '\n',
    );
  }
  onTestEnd(test, result) {
    this.completed++;
    if (result.status !== 'passed') this.failed++;
    fs.appendFileSync(
      path,
      JSON.stringify({
        type: 'test',
        title: test.titlePath(),
        status: result.status,
        duration: result.duration,
        errors: result.errors,
        attachments: result.attachments.map((a) => ({
          name: a.name,
          path: a.path,
          contentType: a.contentType,
        })),
      }) + '\n',
    );
    if (this.completed % 30 === 0 || result.status !== 'passed')
      console.log(
        `${this.completed}/${this.total}; failures=${this.failed} ${result.status === 'passed' ? '' : test.title}`,
      );
  }
  onEnd(result) {
    fs.appendFileSync(
      path,
      JSON.stringify({
        type: 'end',
        at: new Date().toISOString(),
        ...result,
        completed: this.completed,
        failed: this.failed,
      }) + '\n',
    );
    console.log(`FINAL ${result.status}: ${this.completed}/${this.total}, ${this.failed} failures`);
  }
}
export default Reporter;
