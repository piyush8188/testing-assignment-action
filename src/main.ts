import axios from 'axios';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
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
    const repoName = process.env['GITHUB_REPOSITORY']?.split('/')[1];
    const repoWorkSpace: string | undefined = process.env['GITHUB_WORKSPACE'];
    const token = process.env['ACCIO_ASGMNT_ACTION_TOKEN'];

    if (!token) throw new Error('No token given!');
    if (!repoWorkSpace) throw new Error('No GITHUB_WORKSPACE');
    if (!repoName) throw new Error('Failed to parse repoName');

    const repoWords = repoName?.split('-');
    const studentUserName = repoWords[repoWords.length - 1];

    const accioTestConfigData = fs.readFileSync(
      path.resolve(repoWorkSpace, 'acciotest.json')
    );
    const accioTestConfig = JSON.parse(accioTestConfigData.toString());

    const query = new URLSearchParams();
    query.append('repo', accioTestConfig.testRepo);
    query.append('filePath', accioTestConfig.pathToFile);
    query.append('token', token);

    // Get the encoded test file contents
    const encodedTestFileData = await axios.get(
      'http://localhost:5001/github/action-get-file?' + query.toString()
    );
    const testFileContent = Buffer.from(
      encodedTestFileData.data,
      'base64'
    ).toString('utf8');

    fs.writeFileSync(
      path.resolve(repoWorkSpace, 'tests/test.ts'),
      testFileContent
    );

    await exec.exec('npm install cypress', undefined, {
      cwd: repoWorkSpace
    });

    const cypressPath =
      require.resolve('cypress', {
        paths: [repoWorkSpace]
      }) || 'cypress';

    const cypress = require(cypressPath);
    const testResults = await cypress.run();

    const {data: score} = await axios.post(
      'http://localhost:5001/github/action-get-file',
      {
        testResults,
        studentGituhbUserName: studentUserName
      }
    );

    core.setOutput('totalScore', score.totalScore);
    core.setOutput('scoreReceived', score.scoreReceived);

    process.stdout.write(
      `\nScore: ${score.scoreReceived}/${score.totalScore}\n`
    );
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
