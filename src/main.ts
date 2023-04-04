import axios from 'axios';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import fs from 'fs';
import path from 'path';
import CryptoJS from 'crypto-js';

// acciotest.json
/*
{
  'testRepo': string',
  'pathToFile': 'string'
}
*/

const ignoreFile = [
  '.git',
  '.gitignore',
  'node_modules',
  'package-lock.json',
  'package.json',
  'encrypted',
  '.acciotest.json',
  'test.yml',
  '.cypress.json'
];
const permanentIgnore = ['node_modules', '.git', 'encrypted'];

async function decrypt(
  path: string,
  parentDirectory: string,
  childDirectory: string
) {
  try {
    const dir = await fs.promises.opendir(`${path}/${childDirectory}`);
    const newFilePath = `${path}/${parentDirectory}/${childDirectory}`;
    fs.mkdir(newFilePath, (error: any) => {
      if (error) {
        console.log(error);
      } else {
        console.log('New Directory created successfully !!');
      }
    });
    for await (const dirent of dir) {
      if (dirent.name === parentDirectory) {
        continue;
      } else if (!ignoreFile.includes(dirent.name) && dirent.isDirectory()) {
        decrypt(path, parentDirectory, `${childDirectory}/${dirent.name}`);
      } else if (!ignoreFile.includes(dirent.name) && !dirent.isDirectory()) {
        let content = fs
          .readFileSync(`${path}/${childDirectory}/${dirent.name}`)
          .toString();
        var bytes = CryptoJS.AES.decrypt(content, 'piyush<3rajat');
        var originalText = bytes.toString(CryptoJS.enc.Utf8);
        var stream = fs.createWriteStream(`${newFilePath}/${dirent.name}`);
        stream.write(originalText);
      } else if (!permanentIgnore.includes(dirent.name)) {
        fs.copyFileSync(
          `${path}/${childDirectory}/${dirent.name}`,
          `${newFilePath}/${dirent.name}`
        );
      }
    }
    return;
  } catch (error) {
    console.log(error);
  }
}

async function run(): Promise<void> {
  try {
    const githubRepo = process.env['GITHUB_REPOSITORY'];
    if (!githubRepo) throw new Error('No GITHUB_REPOSITORY');

    const [repoOwner, repoName] = githubRepo.split('/');
    var repoWorkSpace: string | undefined = process.env['GITHUB_WORKSPACE'];
    const token = process.env['ACCIO_ASGMNT_ACTION_TOKEN'];
    // const ACCIO_API_ENDPOINT = 'https://api.acciojob.com';
    const ACCIO_API_ENDPOINT = 'https://acciojob-dev-eobnd7jx2q-el.a.run.app';

    if (!token) throw new Error('No token given!');
    if (!repoWorkSpace) throw new Error('No GITHUB_WORKSPACE');
    if (repoOwner !== 'acciojob') throw new Error('Error not under acciojob');
    if (!repoName) throw new Error('Failed to parse repoName');

    let studentUserName = '';
    let assignmentName = '';

    const contextPayload = github.context.payload;

    if (contextPayload.pusher.username) {
      if (repoName.includes(contextPayload.pusher.username)) {
        const indexOfStudentName = repoName.indexOf(
          contextPayload.pusher.username
        );
        studentUserName = repoName.substring(indexOfStudentName);
        assignmentName = repoName.substring(0, indexOfStudentName - 1);
      }
    } else if (repoName.includes(contextPayload.pusher.name)) {
      const indexOfStudentName = repoName.indexOf(contextPayload.pusher.name);
      studentUserName = repoName.substring(indexOfStudentName);
      assignmentName = repoName.substring(0, indexOfStudentName - 1);
    }

    process.stdout.write(
      `repoWorkSpace = ${repoWorkSpace}\nrepoName = ${repoName}\nstudentName = ${studentUserName}\nassignmentName = ${assignmentName}\n`
    );

    process.stdout.write(
      `Pusher Username = ${contextPayload.pusher.username}\nPusher Name = ${contextPayload.pusher.name}\n`
    );

    if (assignmentName && studentUserName) {
      const questionTypeQuery = new URLSearchParams();

      questionTypeQuery.append('templateName', assignmentName);
      const questionTypeData = await axios.get(
        `${ACCIO_API_ENDPOINT}/github/get-question-type?${questionTypeQuery.toString()}`
      );

      const questionTypeContent = questionTypeData.data;

      process.stdout.write(`question type = ${questionTypeContent}\n`);
      // console.log(questionTypeContent);

      const accioTestConfigData = fs.readFileSync(
        path.resolve(repoWorkSpace, 'acciotest.json')
      );
      if (questionTypeContent == 'CONTEST') {
        await decrypt(repoWorkSpace + '/enrypted', '', '');
        repoWorkSpace = repoWorkSpace + '/encrypted';
      }
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
    process.exit(1);
  }
}

run();
