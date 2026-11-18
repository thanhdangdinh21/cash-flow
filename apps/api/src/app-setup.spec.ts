import { parseCorsOrigins } from './app-setup';

describe('parseCorsOrigins', () => {
  it('defaults to the local web app', () => {
    expect(parseCorsOrigins(undefined)).toEqual(['http://localhost:3000']);
    expect(parseCorsOrigins('')).toEqual(['http://localhost:3000']);
    expect(parseCorsOrigins(' , ')).toEqual(['http://localhost:3000']);
  });

  it('splits a comma-separated list and trims spaces', () => {
    expect(
      parseCorsOrigins(' https://a.example.com ,https://b.example.com,, '),
    ).toEqual(['https://a.example.com', 'https://b.example.com']);
  });

  it('drops a trailing slash, which browsers never send in Origin', () => {
    expect(parseCorsOrigins('https://a.example.com/')).toEqual([
      'https://a.example.com',
    ]);
  });
});
