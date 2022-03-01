import axios from 'axios';
import * as core from '@actions/core';
import fs from 'fs';
import path from 'path';

// acciotest.json
/*
{
  'testRepo': string',
  'pathToFile': 'string'
}
*/

async function run(): Promise<void> {
  try {
    const githubRepo = process.env['GITHUB_REPOSITORY'];
    if (!githubRepo) throw new Error('No GITHUB_REPOSITORY');

    const [repoOwner, repoName] = githubRepo.split('/');
    const repoWorkSpace: string | undefined = process.env['GITHUB_WORKSPACE'];
    const token = process.env['ACCIO_ASGMNT_ACTION_TOKEN'];
    const ACCIO_API_ENDPOINT =
      core.getInput('accio_endpoint') || 'http://localhost:5001';

    if (!token) throw new Error('No token given!');
    if (!repoWorkSpace) throw new Error('No GITHUB_WORKSPACE');
    if (repoOwner !== 'acciojob') throw new Error('Error not under acciojob');
    if (!repoName) throw new Error('Failed to parse repoName');

    const repoWords = repoName?.split('-');
    const studentUserName = repoWords[repoWords.length - 1];

    process.stdout.write(
      `token=${token}, repoWorkSpace=${repoWorkSpace}, repoName=${repoName}, studentName=${studentUserName}\n`
    );

    const accioTestConfigData = fs.readFileSync(
      path.resolve(repoWorkSpace, 'acciotest.json')
    );
    const accioTestConfig = JSON.parse(accioTestConfigData.toString());

    process.stdout.write(`Test Config: ${accioTestConfigData.toString()}`);

    const query = new URLSearchParams();
    query.append('repo', accioTestConfig.testRepo);
    query.append('filePath', accioTestConfig.pathToFile);
    query.append('token', token);

    // Get the encoded test file contents
    const encodedTestFileData = await axios.get(
      `${ACCIO_API_ENDPOINT}/github/action-get-file?${query.toString()}`
    );

    const testFileContent = Buffer.from(
      encodedTestFileData.data,
      'base64'
    ).toString('utf8');

    process.stdout.write(`Test file content: \n${testFileContent}`);

    fs.mkdirSync(path.resolve(repoWorkSpace, 'cypress/integration/tests'), {
      recursive: true
    });

    fs.writeFileSync(
      path.resolve(repoWorkSpace, 'cypress/integration/tests/test.spec.js'),
      testFileContent
    );

    // const cypressInstallExitCode = await exec.exec(
    //   'npm install cypress',
    //   undefined,
    //   {
    //     cwd: repoWorkSpace
    //   }
    // );

    // process.stdout.write(`Cypress install exit code ${cypressInstallExitCode}`);

    const cypressPath =
      require.resolve('cypress', {
        paths: [repoWorkSpace]
      }) || 'cypress';

    const cypress = require(cypressPath);
    const testResults = await cypress.run();

    process.stdout.write(`TestResults: ${JSON.stringify(testResults)}`);

    const {data: score} = await axios.post(
      `${ACCIO_API_ENDPOINT}/github/get-score`,
      {
        token,
        testResults,
        studentGithubUserName: studentUserName
      }
    );

    core.setOutput('totalScore', score.totalScore);
    core.setOutput('scoreReceived', score.scoreReceived);

    process.stdout.write(
      `\nScore: ${score.scoreReceived}/${score.totalScore}\n`
    );
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    process.stderr.write(`Error: ${(error as Error).message}`);
  }
}

run();
