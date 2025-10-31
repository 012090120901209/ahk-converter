import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000
  });

  const testsRoot = __dirname;

  try {
    const files = await glob('**/*.test.js', { cwd: testsRoot });

    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

    return new Promise((resolve, reject) => {
      try {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
