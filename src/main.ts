import axios from 'axios';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
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
      core.getInput('accio_endpoint') ||
      'https://acciojob-app-backend-2-pro-fohi8.ondigitalocean.app';

    if (!token) throw new Error('No token given!');
    if (!repoWorkSpace) throw new Error('No GITHUB_WORKSPACE');
    if (repoOwner !== 'acciojob') throw new Error('Error not under acciojob');
    if (!repoName) throw new Error('Failed to parse repoName');

    const repoWords = repoName?.split('-');
    const studentUserName = repoWords[repoWords.length - 1];
    const assignmentName = repoName.substring(0, repoName.lastIndexOf('-'));

    process.stdout.write(
      `repoWorkSpace = ${repoWorkSpace}\nrepoName = ${repoName}\nstudentName = ${studentUserName}\nassignmentName = ${assignmentName}\n`
    );

    const contextPayload = github.context.payload;
    process.stdout.write(
      `Pusher Username = ${contextPayload.pusher.username}\nPusher Name = ${contextPayload.pusher.name}`
    );

    if (
      (contextPayload.pusher.username &&
        contextPayload.pusher.username === studentUserName) ||
      contextPayload.pusher.name === studentUserName
    ) {
      const accioTestConfigData = fs.readFileSync(
        path.resolve(repoWorkSpace, 'acciotest.json')
      );
      const accioTestConfig = JSON.parse(accioTestConfigData.toString());

      process.stdout.write(`Test Config: ${accioTestConfigData.toString()}`);

      const query = new URLSearchParams();
      query.append('repo', accioTestConfig.testRepo);
      query.append('filePath', accioTestConfig.pathToFile);
      query.append('token', token);

      process.stdout.write(
        `${ACCIO_API_ENDPOINT}/github/action-get-file?${query.toString()}`
      );

      // Get the encoded test file contents
      const encodedTestFileData = await axios.get(
        `${ACCIO_API_ENDPOINT}/github/action-get-file?${query.toString()}`
      );

      const testFileContent = Buffer.from(
        encodedTestFileData.data,
        'base64'
      ).toString('utf8');

      process.stdout.write(testFileContent);

      fs.mkdirSync(path.resolve(repoWorkSpace, 'cypress/integration/tests'), {
        recursive: true
      });

      fs.writeFileSync(
        path.resolve(repoWorkSpace, 'cypress/integration/tests/test.spec.js'),
        testFileContent
      );

      const cypressInstallExitCode = await exec.exec('npm install', undefined, {
        cwd: repoWorkSpace
      });

      process.stdout.write(
        `\nnpm install exit code ${cypressInstallExitCode}\n`
      );

      const startServer = exec.exec('npm start', undefined, {
        cwd: repoWorkSpace
      });

      process.stdout.write(`\nnpm start exit code ${startServer}`);

      const cypressPath =
        require.resolve('cypress', {
          paths: [repoWorkSpace]
        }) || 'cypress';

      const cypress = require(cypressPath);
      const testResults = await cypress.run();

      process.stdout.write(`\nEvaluating score...\n`);

      const {data: score} = await axios.post(
        `${ACCIO_API_ENDPOINT}/github/get-score`,
        {
          token,
          testResults,
          assignmentName,
          repoName,
          studentGithubUserName: studentUserName
        }
      );

      core.setOutput('totalScore', score.totalScore);
      core.setOutput('scoreReceived', score.scoreReceived);

      process.stdout.write(
        `\nScore: ${score.scoreReceived}/${score.totalScore}\n`
      );

      process.exit(0);
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
    process.stderr.write(`Error: ${(error as Error).message}`);
  }
}

run();
