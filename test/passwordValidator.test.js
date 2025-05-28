
const isPasswordValid = require('../src/passwordValidator');


test('Senha válida com letras maiúsculas e números', () => {
    expect(isPasswordValid('Senha123')).toBe(true);
});

test('Senha muito curta', () => {
    expect(isPasswordValid('S1')).toBe(false);
});

test('Senha sem número', () => {
    expect(isPasswordValid('SenhaSenha')).toBe(false);
});

test('Senha sem letra maiúscula', () => {
    expect(isPasswordValid('senha1234')).toBe(false);
});