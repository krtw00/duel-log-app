/**
 * メールアドレスを配信者モード用にマスクする
 * 例: example@gmail.com -> e*****e@g***l.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;

  const parts = email.split('@');
  if (parts.length !== 2) return email;

  const localPart = parts[0];
  const domain = parts[1];

  // ローカル部分をマスク
  let maskedLocal = '';
  if (localPart.length <= 2) {
    maskedLocal = '*'.repeat(localPart.length);
  } else {
    const firstChar = localPart.charAt(0);
    const lastChar = localPart.charAt(localPart.length - 1);
    const middleLength = localPart.length - 2;
    maskedLocal = firstChar + '*'.repeat(middleLength) + lastChar;
  }

  // ドメイン部分をマスク
  const domainParts = domain.split('.');
  const maskedDomainParts = domainParts.map((part) => {
    if (part.length <= 2) {
      return '*'.repeat(part.length);
    }
    const firstChar = part.charAt(0);
    const lastChar = part.charAt(part.length - 1);
    const middleLength = part.length - 2;
    return firstChar + '*'.repeat(middleLength) + lastChar;
  });

  return maskedLocal + '@' + maskedDomainParts.join('.');
};
