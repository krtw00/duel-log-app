import { describe, it, expect } from 'vitest'
import { maskEmail } from '../maskEmail'

describe('maskEmail', () => {
  it('通常のメールアドレスを正しくマスクする', () => {
    expect(maskEmail('example@gmail.com')).toBe('e*****e@g***l.c*m')
  })

  it('短いローカル部分をマスクする', () => {
    expect(maskEmail('ab@test.com')).toBe('**@t**t.c*m')
  })

  it('長いメールアドレスをマスクする', () => {
    expect(maskEmail('verylongemail@example.co.jp')).toBe('v***********l@e*****e.**.**')
  })

  it('1文字のローカル部分をマスクする', () => {
    expect(maskEmail('a@test.com')).toBe('*@t**t.c*m')
  })

  it('複数のドメインセグメントを正しくマスクする', () => {
    expect(maskEmail('user@mail.example.co.uk')).toBe('u**r@m**l.e*****e.**.**')
  })

  it('サブドメインを含むメールアドレスをマスクする', () => {
    expect(maskEmail('test@subdomain.example.com')).toBe('t**t@s*******n.e*****e.c*m')
  })

  it('空文字列を処理する', () => {
    expect(maskEmail('')).toBe('')
  })

  it('@記号がない場合はそのまま返す', () => {
    expect(maskEmail('notanemail')).toBe('notanemail')
  })

  it('2文字のドメイン部分を完全にマスクする', () => {
    expect(maskEmail('test@ab.cd')).toBe('t**t@**.**')
  })

  it('実際の使用例: Gmail', () => {
    expect(maskEmail('john.doe@gmail.com')).toBe('j******e@g***l.c*m')
  })

  it('実際の使用例: 企業メール', () => {
    expect(maskEmail('taro.yamada@company.co.jp')).toBe('t*********a@c*****y.**.**')
  })

  it('実際の使用例: Outlook', () => {
    expect(maskEmail('user123@outlook.com')).toBe('u*****3@o*****k.c*m')
  })
})