/**
 * メールアドレスを配信者モード用にマスクする
 * 例: example@gmail.com -> e*****e@g***l.com
 */
export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;

  const [localPart, domain] = email.split('@');

  // ローカル部分をマスク
  const maskedLocal =
    localPart.length <= 2
      ? '*'.repeat(localPart.length)
      : `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`;

  // ドメイン部分をマスク
  const domainParts = domain.split('.');
  const maskedDomainParts = domainParts.map((part) => {
    if (part.length <= 2) return '*'.repeat(part.length);
    return `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}`;
  });

  return `${maskedLocal}@${maskedDomainParts.join('.')}`;
};
