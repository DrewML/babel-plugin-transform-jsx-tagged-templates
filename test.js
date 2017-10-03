const babel = require('babel-core');
const plugin = require('.');
const fs = require('fs');

const t = input => {
    const { code, ast } = babel.transform(input, {
        plugins: ['syntax-jsx', plugin]
    });
    return code;
};

test('single self-closing', () => {
    expect(t('<div />')).toMatchSnapshot();
});

test('nested self-closing', () => {
    expect(t('<div><span /></div>')).toMatchSnapshot();
});

test('JSXText child', () => {
    expect(t('<div>foo</div>')).toMatchSnapshot();
});

test('dynamic attr', () => {
    expect(t('<div id={1}></div>')).toMatchSnapshot();
});

test('2 props, 1 dynamic 1 static, dynamic first', () => {
    expect(t('<div id={1} b="a"></div>')).toMatchSnapshot();
});

test.skip('2 props, 1 dynamic 1 static, static first', () => {
    expect(t('<div b="a" id={1}></div>')).toMatchSnapshot();
});
