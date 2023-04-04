"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
// acciotest.json
/*
{
  'testRepo': string',
  'pathToFile': 'string'
}
*/
var ignoreFile = [
    '.git',
    '.gitignore',
    'node_modules',
    'package-lock.json',
    'package.json',
    'encrypted'
];
var permanentIgnore = ['node_modules', '.git', 'encrypted'];
function decrypt(path, parentDirectory, childDirectory) {
    var _a, e_1, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var cryptojs, fs, dir, newFilePath, _d, dir_1, dir_1_1, dirent, content, bytes, originalText, stream, e_1_1, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    cryptojs = require('crypto-js');
                    fs = require('fs');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 15, , 16]);
                    return [4 /*yield*/, fs.promises.opendir("".concat(path, "/").concat(childDirectory))];
                case 2:
                    dir = _e.sent();
                    newFilePath = "".concat(path, "/").concat(parentDirectory, "/").concat(childDirectory);
                    fs.mkdir(newFilePath, function (error) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log('New Directory created successfully !!');
                        }
                    });
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 8, 9, 14]);
                    _d = true, dir_1 = __asyncValues(dir);
                    _e.label = 4;
                case 4: return [4 /*yield*/, dir_1.next()];
                case 5:
                    if (!(dir_1_1 = _e.sent(), _a = dir_1_1.done, !_a)) return [3 /*break*/, 7];
                    _c = dir_1_1.value;
                    _d = false;
                    try {
                        dirent = _c;
                        if (dirent.name === parentDirectory) {
                            return [3 /*break*/, 6];
                        }
                        else if (!ignoreFile.includes(dirent.name) && dirent.isDirectory()) {
                            decrypt(path, parentDirectory, "".concat(childDirectory, "/").concat(dirent.name));
                        }
                        else if (!ignoreFile.includes(dirent.name) && !dirent.isDirectory()) {
                            content = fs.readFileSync("".concat(path, "/").concat(childDirectory, "/").concat(dirent.name))
                                .toString();
                            bytes = cryptojs.CryptoJS.AES.decrypt(content, 'piyush<3rajat');
                            originalText = bytes.toString(cryptojs.CryptoJS.enc.Utf8);
                            stream = fs.createWriteStream("".concat(newFilePath, "/").concat(dirent.name));
                            stream.write(originalText);
                        }
                        else if (!permanentIgnore.includes(dirent.name)) {
                            fs.copyFileSync("".concat(path, "/").concat(childDirectory, "/").concat(dirent.name), "".concat(newFilePath, "/").concat(dirent.name));
                        }
                    }
                    finally {
                        _d = true;
                    }
                    _e.label = 6;
                case 6: return [3 /*break*/, 4];
                case 7: return [3 /*break*/, 14];
                case 8:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 14];
                case 9:
                    _e.trys.push([9, , 12, 13]);
                    if (!(!_d && !_a && (_b = dir_1["return"]))) return [3 /*break*/, 11];
                    return [4 /*yield*/, _b.call(dir_1)];
                case 10:
                    _e.sent();
                    _e.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 13: return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
                case 15:
                    error_1 = _e.sent();
                    console.log(error_1);
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var fs, path, axios, githubRepo, _a, repoOwner, repoName, repoWorkSpace, token, ACCIO_API_ENDPOINT, studentUserName, assignmentName, contextPayload, questionTypeQuery, questionTypeData, questionTypeContent, accioTestConfigData, accioTestConfig, query, encodedTestFileData, testFileContent, cypressInstallExitCode, startServer, cypressPath, cypress, testResults, score, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    fs = require('fs');
                    path = require('path');
                    axios = require('axios');
                    githubRepo = process.env['GITHUB_REPOSITORY'];
                    if (!githubRepo)
                        throw new Error('No GITHUB_REPOSITORY');
                    _a = githubRepo.split('/'), repoOwner = _a[0], repoName = _a[1];
                    repoWorkSpace = process.env['GITHUB_WORKSPACE'];
                    token = process.env['ACCIO_ASGMNT_ACTION_TOKEN'];
                    ACCIO_API_ENDPOINT = 'https://acciojob-dev-eobnd7jx2q-el.a.run.app';
                    if (!token)
                        throw new Error('No token given!');
                    if (!repoWorkSpace)
                        throw new Error('No GITHUB_WORKSPACE');
                    if (repoOwner !== 'acciojob')
                        throw new Error('Error not under acciojob');
                    if (!repoName)
                        throw new Error('Failed to parse repoName');
                    studentUserName = 'A';
                    assignmentName = 'wait-for-multiple-promises';
                    contextPayload = github.context.payload;
                    // if (contextPayload.pusher.username) {
                    //   if (repoName.includes(contextPayload.pusher.username)) {
                    //     const indexOfStudentName = repoName.indexOf(
                    //       contextPayload.pusher.username
                    //     );
                    //     studentUserName = repoName.substring(indexOfStudentName);
                    //     assignmentName = repoName.substring(0, indexOfStudentName - 1);
                    //   }
                    // } else if (repoName.includes(contextPayload.pusher.name)) {
                    //   const indexOfStudentName = repoName.indexOf(contextPayload.pusher.name);
                    //   studentUserName = repoName.substring(indexOfStudentName);
                    //   assignmentName = repoName.substring(0, indexOfStudentName - 1);
                    // }
                    process.stdout.write("repoWorkSpace = ".concat(repoWorkSpace, "\nrepoName = ").concat(repoName, "\nstudentName = ").concat(studentUserName, "\nassignmentName = ").concat(assignmentName, "\n"));
                    if (!(assignmentName && studentUserName)) return [3 /*break*/, 8];
                    questionTypeQuery = new URLSearchParams();
                    questionTypeQuery.append('templateName', assignmentName);
                    return [4 /*yield*/, axios.get("".concat(ACCIO_API_ENDPOINT, "/github/get-question-type?").concat(questionTypeQuery))];
                case 1:
                    questionTypeData = _b.sent();
                    questionTypeContent = Buffer.from(questionTypeData.data, 'base64').toString('utf8');
                    process.stdout.write("".concat(questionTypeContent));
                    accioTestConfigData = fs.readFileSync(path.resolve(repoWorkSpace, 'acciotest.json'));
                    if (!(questionTypeContent == 'CONTEST')) return [3 /*break*/, 3];
                    return [4 /*yield*/, decrypt('', '', '')];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    accioTestConfig = JSON.parse(accioTestConfigData.toString());
                    process.stdout.write("Test Config: ".concat(accioTestConfigData.toString()));
                    query = new URLSearchParams();
                    query.append('repo', accioTestConfig.testRepo);
                    query.append('filePath', accioTestConfig.pathToFile);
                    query.append('token', token);
                    return [4 /*yield*/, axios.get("".concat(ACCIO_API_ENDPOINT, "/github/action-get-file?").concat(query.toString()))];
                case 4:
                    encodedTestFileData = _b.sent();
                    testFileContent = Buffer.from(encodedTestFileData.data, 'base64').toString('utf8');
                    fs.mkdirSync(path.resolve(repoWorkSpace, 'cypress/integration/tests'), {
                        recursive: true
                    });
                    fs.writeFileSync(path.resolve(repoWorkSpace, 'cypress/integration/tests/test.spec.js'), testFileContent);
                    return [4 /*yield*/, exec.exec('npm install', undefined, {
                            cwd: repoWorkSpace
                        })];
                case 5:
                    cypressInstallExitCode = _b.sent();
                    process.stdout.write("\nnpm install exit code ".concat(cypressInstallExitCode, "\n"));
                    startServer = exec.exec('npm start', undefined, {
                        cwd: repoWorkSpace
                    });
                    process.stdout.write("\nnpm start exit code ".concat(startServer));
                    cypressPath = require.resolve('cypress', {
                        paths: [repoWorkSpace]
                    }) || 'cypress';
                    cypress = require(cypressPath);
                    return [4 /*yield*/, cypress.run()];
                case 6:
                    testResults = _b.sent();
                    process.stdout.write("\nEvaluating score...\n");
                    return [4 /*yield*/, axios.post("".concat(ACCIO_API_ENDPOINT, "/github/get-score"), {
                            token: token,
                            testResults: testResults,
                            assignmentName: assignmentName,
                            repoName: repoName,
                            studentGithubUserName: studentUserName
                        })];
                case 7:
                    score = (_b.sent()).data;
                    core.setOutput('totalScore', score.totalScore);
                    core.setOutput('scoreReceived', score.scoreReceived);
                    process.stdout.write("\nScore: ".concat(score.scoreReceived, "/").concat(score.totalScore, "\n"));
                    process.exit(0);
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    error_2 = _b.sent();
                    if (error_2 instanceof Error)
                        core.setFailed(error_2.message);
                    process.stderr.write("Error: ".concat(error_2.message));
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
run();
