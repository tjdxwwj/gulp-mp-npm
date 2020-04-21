const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const glob = require('glob');
const diff = require('lodash/difference')
const utils = require('./utils');
jest.mock('console');
const mpNpm = require('../index');

const unitFixtures = path.join(__dirname, 'fixtures/unit-test');
const unitExpected = path.join(__dirname, 'expected/unit-test');

// config
jest.setTimeout(10000);

// tests
describe('单元测试', () => {

    test('返回一个 Stream', (done) => {
        const stream = mpNpm();
        expect(stream).not.toBeNil();
        expect(stream.on).not.toBeNil();
        done();
    });

    // 测试输出
    function testOuput(input, output, done, options = {}) {
        const actualFiles = []; // 实际文件目录结构
        const expectFiles = glob.sync(`${output}/**`, { cwd: unitExpected, absolute: true, nodir: true }); // 预期文件目录结构
        gulp.src(input, { cwd: unitFixtures, nodir: true })
            .pipe(mpNpm(options.mpNpmOptions))
            // .pipe(gulp.dest(path.join(unitExpected, output)))
            .on('error', done)
            .on('data', (file) => {
                expect(file).not.toBeNil();
                expect(file.path).not.toBeNil();
                expect(file.base).not.toBeNil();
                expect(file.contents).not.toBeNil();
                // 找到预期文件
                const expectPath = path.join(unitExpected, output, file.path.replace(file.base, ''));
                expect(fs.existsSync(expectPath) ? expectPath : undefined)
                    .toBe(expectPath);
                // 文件内容是否符合预期
                const actualContent = utils.normaliseEOL(file.contents)
                const expectContent = utils.normaliseEOL(fs.readFileSync(expectPath, 'utf8'));
                expect(actualContent).toBe(expectContent);
                actualFiles.push(expectPath);
            })
            .on('end', () => {
                // 实际比预期多出的文件
                expect(diff(actualFiles, expectFiles)).toBeEmpty();
                // 实际比预期缺少的文件
                expect(diff(expectFiles, actualFiles)).toBeEmpty();
                done();
            })
    }

    test('js 中引入普通 npm 依赖', (done) => {
        testOuput('import-normal-dep.js', 'import-normal-dep.js/', done);
    });

    test('wxss 中引入普通 npm 依赖', (done) => {
        testOuput('import-normal-dep.wxss', 'import-normal-dep.wxss/', done);
    });

    test('js 中引入小程序专用 npm 依赖', (done) => {
        testOuput('import-special-dep.js', 'import-special-dep.js/', done);
    });

    test('json 中引入小程序专用 npm 组件', (done) => {
        testOuput('import-special-dep.json', 'import-special-dep.json/', done);
    });

    test('wxss 中引入小程序专用 npm 组件', (done) => {
        testOuput('import-special-dep.wxss', 'import-special-dep.wxss/', done);
    });

    test('自定义 npmDirname 提取文件夹', (done) => {
        const mpNpmOptions = { npmDirname: 'dist' };
        testOuput([
            'import-normal-dep.js',
            'import-normal-dep.wxss',
            'import-special-dep.js',
            'import-special-dep.json',
            'import-special-dep.wxss',
        ], 'customize-npmDirname', done, { mpNpmOptions });
    });

});